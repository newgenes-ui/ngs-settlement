const fs = require('fs');
const path = require('path');

// 2026년 기준
const YEAR = 2026;

// 현재 폴더의 파일 목록 스캔하여 최신 월 찾기
function detectLatestMonth() {
    const files = fs.readdirSync('.');
    let maxMonth = 0;

    for (const file of files) {
        // "7월 매출1.csv", "7월 매출.csv", "7월매입1.csv" 등에서 숫자 추출
        const match = file.match(/^(\d+)월\s*(매출|매입|카드매출)/);
        if (match) {
            const m = parseInt(match[1], 10);
            if (m > maxMonth) {
                maxMonth = m;
            }
        }
    }
    return maxMonth;
}

// 특정 월의 파일들 찾기
function getFilesForMonth(month) {
    const files = fs.readdirSync('.');
    let salesFile = null;
    let purchaseFile = null;
    let cardFile = null;

    for (const file of files) {
        if (file.startsWith(`${month}월`)) {
            if (file.includes('매출') && !file.includes('카드') && file.endsWith('.csv')) {
                // "7월 매출1.csv" 우선, 없으면 "7월 매출.csv"
                if (!salesFile || file.includes('1')) salesFile = file;
            } else if (file.includes('매입') && file.endsWith('.csv')) {
                if (!purchaseFile || file.includes('1')) purchaseFile = file;
            } else if (file.includes('카드') && file.endsWith('.csv')) {
                cardFile = file;
            }
        }
    }

    return { salesFile, purchaseFile, cardFile };
}

function processMerge() {
    const latestMonth = detectLatestMonth();
    if (latestMonth === 0) {
        console.log("새로운 월별 데이터 파일(*월 매출.csv 등)을 찾지 못했습니다.");
        return;
    }

    console.log(`감지된 최신 월: ${latestMonth}월`);
    const { salesFile, purchaseFile, cardFile } = getFilesForMonth(latestMonth);

    if (!salesFile || !purchaseFile || !cardFile) {
        console.log(`오류: ${latestMonth}월의 매출, 매입, 카드매출 CSV 파일이 모두 존재해야 합니다.`);
        console.log(`찾은 파일 - 매출: ${salesFile || '없음'}, 매입: ${purchaseFile || '없음'}, 카드: ${cardFile || '없음'}`);
        return;
    }

    console.log(`병합 시작 - 매출: ${salesFile}, 매입: ${purchaseFile}, 카드: ${cardFile}`);

    const monthStr = String(latestMonth).padStart(2, '0');
    const datePrefix = `${YEAR}-${monthStr}`;

    // 이미 병합되었는지 확인 (매출.csv의 첫 데이터 줄 검사)
    const masterSalesContent = fs.readFileSync('매출.csv', 'utf8');
    if (masterSalesContent.includes(datePrefix)) {
        console.log(`${latestMonth}월 데이터는 이미 매출.csv에 병합되어 있습니다. 병합을 건너뜁니다.`);
        return;
    }

    // 1. 매출 병합
    const salesHeader = masterSalesContent.split(/\r?\n/);
    const julySales = fs.readFileSync(salesFile, 'utf8').split(/\r?\n/);
    const salesHeaderLines = salesHeader.slice(0, 2);
    const originalSalesData = salesHeader.slice(2).filter(line => line.trim() !== '');
    const newSalesData = julySales.slice(6).filter(line => line.trim() !== '' && line.startsWith(`${YEAR}-`));
    const mergedSales = [...salesHeaderLines, ...newSalesData, ...originalSalesData].join('\n') + '\n';
    fs.writeFileSync('매출.csv', mergedSales, 'utf8');
    console.log(`매출 병합 완료 (신규 ${newSalesData.length}행 추가)`);

    // 2. 매입 병합
    const purchaseHeader = fs.readFileSync('매입.csv', 'utf8').split(/\r?\n/);
    const julyPurchase = fs.readFileSync(purchaseFile, 'utf8').split(/\r?\n/);
    const purchaseHeaderLines = purchaseHeader.slice(0, 2);
    const originalPurchaseData = purchaseHeader.slice(2).filter(line => line.trim() !== '');
    const newPurchaseData = julyPurchase.slice(6).filter(line => line.trim() !== '' && line.startsWith(`${YEAR}-`));
    const mergedPurchase = [...purchaseHeaderLines, ...newPurchaseData, ...originalPurchaseData].join('\n') + '\n';
    fs.writeFileSync('매입.csv', mergedPurchase, 'utf8');
    console.log(`매입 병합 완료 (신규 ${newPurchaseData.length}행 추가)`);

    // 3. 카드매출 병합 및 총계 업데이트
    const cardHeader = fs.readFileSync('카드매출전표.csv', 'utf8').split(/\r?\n/);
    const julyCard = fs.readFileSync(cardFile, 'utf8').split(/\r?\n/);
    const cardHeaderLines = cardHeader.slice(0, 3);
    const originalCardData = cardHeader.slice(3).filter(line => line.trim() !== '' && !line.startsWith('총계'));
    const newCardData = julyCard.slice(6).filter(line => line.trim() !== '' && line.startsWith(`${YEAR}-`));

    // 신규 카드매출 총계 계산을 위한 파싱 함수
    function parseAmount(val) {
        if (!val) return 0;
        return parseInt(val.replace(/"/g, '').replace(/,/g, ''), 10) || 0;
    }

    // 총계 누적 계산
    let totalTradeSum = 0;
    let totalCount = 0;
    let totalApproveSum = 0;
    let totalApproveCount = 0;
    let totalCancelSum = 0;
    let totalCancelCount = 0;

    const allCardRows = [...newCardData, ...originalCardData];
    allCardRows.forEach(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // CSV쉼표 분할 (큰따옴표 고려)
        if (cols.length >= 7) {
            totalTradeSum += parseAmount(cols[1]);
            totalCount += parseAmount(cols[2]);
            totalApproveSum += parseAmount(cols[3]);
            totalApproveCount += parseAmount(cols[4]);
            totalCancelSum += parseAmount(cols[5]);
            totalCancelCount += parseAmount(cols[6]);
        }
    });

    const formatNum = (num) => {
        return `"${num.toLocaleString('ko-KR')}"`;
    };

    const newTotalLine = `총계,${formatNum(totalTradeSum)},${totalCount},${formatNum(totalApproveSum)},${totalApproveCount},${formatNum(totalCancelSum)},${totalCancelCount}`;
    const mergedCard = [...cardHeaderLines, ...newCardData, ...originalCardData, newTotalLine].join('\n') + '\n';
    fs.writeFileSync('카드매출전표.csv', mergedCard, 'utf8');
    console.log(`카드매출 병합 완료 (신규 ${newCardData.length}행 추가, 총계 업데이트 완료)`);

    // 4. app.js cutoffDate 업데이트
    const lastDay = new Date(YEAR, latestMonth, 0).getDate();
    const newCutoffDate = `${YEAR}/${String(latestMonth).padStart(2, '0')}/${String(lastDay).padStart(2, '0')}`;
    
    let appContent = fs.readFileSync('app.js', 'utf8');
    const cutoffRegex = /const cutoffDate\s*=\s*"[^"]+";/;
    
    if (cutoffRegex.test(appContent)) {
        appContent = appContent.replace(cutoffRegex, `const cutoffDate = "${newCutoffDate}";`);
        fs.writeFileSync('app.js', appContent, 'utf8');
        console.log(`app.js cutoffDate 업데이트 완료 -> "${newCutoffDate}"`);
    } else {
        console.log("경고: app.js에서 const cutoffDate 선언을 찾지 못했습니다.");
    }

    console.log("모든 데이터 병합 및 설정 업데이트가 완료되었습니다!");
}

processMerge();
