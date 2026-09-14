const fs = require('fs');
const path = require('path');

// 기준 연도
const YEAR = 2026;

// ===== CSV 유틸리티 함수 =====
function parseCSVTextIntoLines(text) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
            currentLine += ch;
        } else if (ch === '\n' && !inQuotes) {
            lines.push(currentLine);
            currentLine = '';
        } else if (ch === '\r') {
            if (inQuotes) currentLine += ch;
        } else {
            currentLine += ch;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.filter(l => l.trim());
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else if (ch === '\r') {
            continue;
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function parseAmount(val) {
    if (!val) return 0;
    return parseInt(String(val).replace(/"/g, '').replace(/,/g, '').trim(), 10) || 0;
}

function formatAmount(num) {
    if (num === 0) return '0';
    return `"${num.toLocaleString('ko-KR')}"`;
}

// ===== 파일 타입 자동 감지 =====
function classifyFile(fileName) {
    // 마스터 파일은 분류 대상에서 제외 (별도 처리)
    if (['매출.csv', '매입.csv', '카드매출전표.csv'].includes(fileName)) {
        return 'master';
    }
    // 재고 및 기초 데이터 제외
    if (fileName.includes('기초매입') || fileName.includes('재고') || fileName.includes('판매현황') || fileName.includes('추가매입')) {
        return 'ignore';
    }
    if (!fileName.endsWith('.csv')) {
        return 'ignore';
    }

    try {
        const content = fs.readFileSync(fileName, 'utf8');
        const first1000 = content.slice(0, 1000);

        // 사업용신용카드 매입자료 감지
        if ((fileName.includes('신용카드') && fileName.includes('매입')) || fileName.includes('사업용신용카드') || first1000.includes('화물운전자복지카드') || first1000.includes('사업용신용카드')) {
            return 'vat_card';
        }

        if (first1000.includes('매출 전자(수정) 세금계산서') || (fileName.includes('매출') && !fileName.includes('카드') && first1000.includes('승인번호'))) {
            return 'sales';
        }
        if (first1000.includes('매입 전자(수정) 세금계산서') || (fileName.includes('매입') && first1000.includes('승인번호'))) {
            return 'purchase';
        }
        if (first1000.includes('일별 승인내역 조회') || first1000.includes('거래합계,거래건수,승인소계') || fileName.includes('카드') || fileName.includes('기간별승인내역')) {
            return 'card';
        }
    } catch (e) {
        return 'ignore';
    }

    return 'ignore';
}

function runMerge() {
    console.log('====================================================');
    console.log(' [NGS 결산] 스마트 데이터 자동 병합 및 갱신 시작');
    console.log('====================================================');

    // 0. 다운로드 폴더에서 최신 국세청/카드사 CSV 자동 가져오기 (최근 14일 이내)
    try {
        const userProfile = process.env.USERPROFILE || 'C:\\Users\\admin';
        const downloadsDir = path.join(userProfile, 'Downloads');
        if (fs.existsSync(downloadsDir)) {
            const dlFiles = fs.readdirSync(downloadsDir);
            const now = Date.now();
            dlFiles.forEach(f => {
                if (f.endsWith('.csv') && (f.includes('세금계산서') || f.includes('승인내역') || f.includes('매출') || f.includes('매입') || f.includes('신용카드') || f.includes('사업용'))) {
                    const fullPath = path.join(downloadsDir, f);
                    try {
                        const stat = fs.statSync(fullPath);
                        if (now - stat.mtimeMs < 14 * 24 * 60 * 60 * 1000) {
                            const targetPath = path.join('.', f);
                            if (!fs.existsSync(targetPath)) {
                                fs.copyFileSync(fullPath, targetPath);
                                console.log(`   📥 다운로드 폴더에서 새 파일 감지 및 가져옴: ${f}`);
                            }
                        }
                    } catch (e) {}
                }
            });
        }
    } catch (e) {}

    const allFiles = fs.readdirSync('.');
    const salesFiles = [];
    const purchaseFiles = [];
    const cardFiles = [];
    const vatCardFiles = [];

    allFiles.forEach(f => {
        const type = classifyFile(f);
        if (type === 'sales') salesFiles.push(f);
        else if (type === 'purchase') purchaseFiles.push(f);
        else if (type === 'card') cardFiles.push(f);
        else if (type === 'vat_card') vatCardFiles.push(f);
    });

    console.log(`\n📁 감지된 추가 데이터 파일 목록:`);
    console.log(` - 매출 파일: ${salesFiles.length > 0 ? salesFiles.join(', ') : '(없음)'}`);
    console.log(` - 매입 파일: ${purchaseFiles.length > 0 ? purchaseFiles.join(', ') : '(없음)'}`);
    console.log(` - 카드매출 파일: ${cardFiles.length > 0 ? cardFiles.join(', ') : '(없음)'}`);
    console.log(` - 사업용신용카드 매입 파일: ${vatCardFiles.length > 0 ? vatCardFiles.join(', ') : '(없음)'}`);

    // ===== 1. 매출 데이터 병합 =====
    console.log('\n[1/4] 매출 세금계산서 병합 중...');
    const masterSalesContent = fs.existsSync('매출.csv') ? fs.readFileSync('매출.csv', 'utf8') : '';
    const masterSalesLines = parseCSVTextIntoLines(masterSalesContent);
    const salesHeaderLines = masterSalesLines.slice(0, 2);
    if (salesHeaderLines.length < 2) {
        throw new Error('매출.csv의 기본 헤더가 손상되었습니다.');
    }

    const salesMap = new Map();

    function ingestSalesFile(text, label) {
        const lines = parseCSVTextIntoLines(text);
        let added = 0;
        for (const line of lines) {
            const cols = parseCSVLine(line);
            if (cols.length >= 15 && cols[0]) {
                const cleanDate = cols[0].trim().replace(/^\ufeff/, '');
                if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(cleanDate) && cols[1]) {
                    const approvalNo = cols[1].trim();
                    const cleanLine = line.replace(/^\ufeff/, '');
                    salesMap.set(approvalNo, { date: cleanDate, line: cleanLine });
                    added++;
                }
            }
        }
        return added;
    }

    const initialSalesCount = ingestSalesFile(masterSalesContent, '매출.csv');
    salesFiles.forEach(f => {
        const cnt = ingestSalesFile(fs.readFileSync(f, 'utf8'), f);
        console.log(`   -> ${f} : ${cnt}행 처리`);
    });

    // 날짜 내림차순 정렬
    const sortedSales = Array.from(salesMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const newSalesContent = [...salesHeaderLines, ...sortedSales.map(item => item.line)].join('\n') + '\n';
    fs.writeFileSync('매출.csv', newSalesContent, 'utf8');
    console.log(`   ✅ 매출.csv 저장 완료: 총 ${sortedSales.length}건 (기존 ${initialSalesCount}건 대비 +${sortedSales.length - initialSalesCount}건 신규/수정 반영)`);


    // ===== 2. 매입 데이터 병합 =====
    console.log('\n[2/4] 매입 세금계산서 병합 중...');
    const masterPurchaseContent = fs.existsSync('매입.csv') ? fs.readFileSync('매입.csv', 'utf8') : '';
    const masterPurchaseLines = parseCSVTextIntoLines(masterPurchaseContent);
    const purchaseHeaderLines = masterPurchaseLines.slice(0, 2);
    if (purchaseHeaderLines.length < 2) {
        throw new Error('매입.csv의 기본 헤더가 손상되었습니다.');
    }

    const purchaseMap = new Map();

    function ingestPurchaseFile(text, label) {
        const lines = parseCSVTextIntoLines(text);
        let added = 0;
        for (const line of lines) {
            const cols = parseCSVLine(line);
            if (cols.length >= 15 && cols[0]) {
                const cleanDate = cols[0].trim().replace(/^\ufeff/, '');
                if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(cleanDate) && cols[1]) {
                    const approvalNo = cols[1].trim();
                    const cleanLine = line.replace(/^\ufeff/, '');
                    purchaseMap.set(approvalNo, { date: cleanDate, line: cleanLine });
                    added++;
                }
            }
        }
        return added;
    }

    const initialPurchaseCount = ingestPurchaseFile(masterPurchaseContent, '매입.csv');
    purchaseFiles.forEach(f => {
        const cnt = ingestPurchaseFile(fs.readFileSync(f, 'utf8'), f);
        console.log(`   -> ${f} : ${cnt}행 처리`);
    });

    // 날짜 내림차순 정렬
    const sortedPurchase = Array.from(purchaseMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const newPurchaseContent = [...purchaseHeaderLines, ...sortedPurchase.map(item => item.line)].join('\n') + '\n';
    fs.writeFileSync('매입.csv', newPurchaseContent, 'utf8');
    console.log(`   ✅ 매입.csv 저장 완료: 총 ${sortedPurchase.length}건 (기존 ${initialPurchaseCount}건 대비 +${sortedPurchase.length - initialPurchaseCount}건 신규/수정 반영)`);


    // ===== 3. 카드매출 데이터 병합 =====
    console.log('\n[3/4] 카드매출전표 병합 중...');
    const masterCardContent = fs.existsSync('카드매출전표.csv') ? fs.readFileSync('카드매출전표.csv', 'utf8') : '';
    const masterCardLines = parseCSVTextIntoLines(masterCardContent);
    const cardHeaderLines = masterCardLines.slice(0, 3);
    if (cardHeaderLines.length < 3) {
        throw new Error('카드매출전표.csv의 기본 헤더가 손상되었습니다.');
    }

    const cardMap = new Map();

    function ingestCardFile(text, label) {
        const lines = parseCSVTextIntoLines(text);
        let added = 0;
        for (const line of lines) {
            const cols = parseCSVLine(line);
            if (cols.length >= 7 && cols[0] && cols[0] !== '총계') {
                const cleanDate = cols[0].trim().replace(/^\ufeff/, '');
                if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(cleanDate)) {
                    cardMap.set(cleanDate, {
                        date: cleanDate,
                        totalTrade: parseAmount(cols[1]),
                        totalCount: parseAmount(cols[2]),
                        approveSum: parseAmount(cols[3]),
                        approveCount: parseAmount(cols[4]),
                        cancelSum: parseAmount(cols[5]),
                        cancelCount: parseAmount(cols[6])
                    });
                    added++;
                }
            }
        }
        return added;
    }

    const initialCardDays = ingestCardFile(masterCardContent, '카드매출전표.csv');
    cardFiles.forEach(f => {
        const cnt = ingestCardFile(fs.readFileSync(f, 'utf8'), f);
        console.log(`   -> ${f} : ${cnt}행 처리`);
    });

    // 날짜 내림차순 정렬 및 총계 산출
    const sortedCard = Array.from(cardMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    let sumTrade = 0;
    let sumTradeCount = 0;
    let sumApprove = 0;
    let sumApproveCount = 0;
    let sumCancel = 0;
    let sumCancelCount = 0;

    const cardDataLines = sortedCard.map(c => {
        sumTrade += c.totalTrade;
        sumTradeCount += c.totalCount;
        sumApprove += c.approveSum;
        sumApproveCount += c.approveCount;
        sumCancel += c.cancelSum;
        sumCancelCount += c.cancelCount;

        return `${c.date},${formatAmount(c.totalTrade)},${c.totalCount},${formatAmount(c.approveSum)},${c.approveCount},${formatAmount(c.cancelSum)},${c.cancelCount}`;
    });

    const totalLine = `총계,${formatAmount(sumTrade)},${sumTradeCount},${formatAmount(sumApprove)},${sumApproveCount},${formatAmount(sumCancel)},${sumCancelCount}`;
    const newCardContent = [...cardHeaderLines, ...cardDataLines, totalLine].join('\n') + '\n';
    fs.writeFileSync('카드매출전표.csv', newCardContent, 'utf8');
    console.log(`   ✅ 카드매출전표.csv 저장 완료: 총 ${sortedCard.length}영업일 (기존 ${initialCardDays}일 대비 +${sortedCard.length - initialCardDays}일 추가, 총계 갱신 완료)`);


    // ===== 4. 최신 월 감지 및 cutoffDate 자동 갱신 =====
    console.log('\n[4/4] 데이터 마감일(cutoffDate) 자동 갱신 중...');
    const allDates = [
        ...sortedSales.map(s => s.date),
        ...sortedPurchase.map(p => p.date),
        ...sortedCard.map(c => c.date)
    ];

    let maxDateStr = '2026-07-31';
    allDates.forEach(d => {
        if (d > maxDateStr) maxDateStr = d;
    });

    const dateMatch = maxDateStr.match(/^(\d{4})[-/](\d{2})/);
    let newCutoffDate = '2026/08/31';
    let targetYear = YEAR;
    let targetMonth = 8;

    if (dateMatch) {
        targetYear = parseInt(dateMatch[1], 10);
        targetMonth = parseInt(dateMatch[2], 10);
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        newCutoffDate = `${targetYear}/${String(targetMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`;
    }

    let appContent = fs.readFileSync('app.js', 'utf8');
    const cutoffRegex = /const cutoffDate\s*=\s*"[^"]+";/;
    if (cutoffRegex.test(appContent)) {
        appContent = appContent.replace(cutoffRegex, `const cutoffDate = "${newCutoffDate}";`);
        fs.writeFileSync('app.js', appContent, 'utf8');
        console.log(`   ✅ app.js 마감일(cutoffDate) 설정 완료: "${newCutoffDate}" (${targetMonth}월 말일)`);
    } else {
        console.log(`   ⚠️ app.js에서 const cutoffDate 선언을 찾지 못했습니다.`);
    }

    // ===== 5. 커스텀 입력 데이터(custom_inputs.json) 감지 및 app.js 기본값 영구 동기화 =====
    // 1) 다운로드 폴더에서 custom_inputs.json 가져오기
    try {
        const userProfile = process.env.USERPROFILE || 'C:\\Users\\admin';
        const dlCustom = path.join(userProfile, 'Downloads', 'custom_inputs.json');
        if (fs.existsSync(dlCustom)) {
            fs.copyFileSync(dlCustom, 'custom_inputs.json');
            try { fs.unlinkSync(dlCustom); } catch(e) {}
            console.log(`   📥 다운로드 폴더에서 custom_inputs.json 가져옴`);
        }
    } catch (e) {}

    if (fs.existsSync('custom_inputs.json')) {
        try {
            console.log('\n[5/5] 웹에서 입력/수정된 커스텀 결산 데이터(custom_inputs.json) 병합 중...');
            const customData = JSON.parse(fs.readFileSync('custom_inputs.json', 'utf8'));
            let updatedApp = fs.readFileSync('app.js', 'utf8');

            if (customData.vat && Array.isArray(customData.vat)) {
                const vatRegex = /const DEFAULT_VAT_CARD_DATA\s*=\s*\[[\s\S]*?\];/;
                if (vatRegex.test(updatedApp)) {
                    updatedApp = updatedApp.replace(vatRegex, `const DEFAULT_VAT_CARD_DATA = ${JSON.stringify(customData.vat, null, 4)};`);
                    console.log(`   ✅ 사업용신용카드 매입 기본값 영구 반영 완료 (${customData.vat.length}개월)`);
                }
            }
            if (customData.labor && Array.isArray(customData.labor)) {
                const laborRegex = /const DEFAULT_FIXED_LABOR_DATA\s*=\s*\[[\s\S]*?\];/;
                if (laborRegex.test(updatedApp)) {
                    updatedApp = updatedApp.replace(laborRegex, `const DEFAULT_FIXED_LABOR_DATA = ${JSON.stringify(customData.labor, null, 4)};`);
                    console.log(`   ✅ 고정지출(인건비) 기본값 영구 반영 완료`);
                }
            }
            if (customData.office && Array.isArray(customData.office)) {
                const officeRegex = /const DEFAULT_FIXED_OFFICE_DATA\s*=\s*\[[\s\S]*?\];/;
                if (officeRegex.test(updatedApp)) {
                    updatedApp = updatedApp.replace(officeRegex, `const DEFAULT_FIXED_OFFICE_DATA = ${JSON.stringify(customData.office, null, 4)};`);
                    console.log(`   ✅ 고정지출(임대/통신) 기본값 영구 반영 완료`);
                }
            }
            if (customData.vendor && Array.isArray(customData.vendor)) {
                const vendorRegex = /const DEFAULT_FIXED_VENDOR_DATA\s*=\s*\[[\s\S]*?\];/;
                if (vendorRegex.test(updatedApp)) {
                    updatedApp = updatedApp.replace(vendorRegex, `const DEFAULT_FIXED_VENDOR_DATA = ${JSON.stringify(customData.vendor, null, 4)};`);
                    console.log(`   ✅ 고정지출(거래처) 기본값 영구 반영 완료`);
                }
            }

            fs.writeFileSync('app.js', updatedApp, 'utf8');
        } catch (e) {
            console.log(`   ⚠️ custom_inputs.json 처리 중 오류:`, e.message);
        }
    }

    console.log('\n🎉 모든 데이터 병합 및 설정이 성공적으로 완료되었습니다!');
}

try {
    runMerge();
} catch (err) {
    console.error('\n❌ 데이터 병합 중 오류 발생:', err.message);
    process.exit(1);
}
