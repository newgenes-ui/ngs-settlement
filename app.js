// ===== NGS 결산보고서 앱 =====
// (주)뉴진사이언스 결산 데이터 시각화 및 조회 시스템

(function() {
    'use strict';

    // ===== 상태 관리 =====
    const state = {
        currentView: 'dashboard',
        currentPeriod: 'all',    // 'all' | 'quarterly' | 'monthly'
        selectedSubPeriod: null,
        salesData: [],
        cardSalesData: [],
        purchaseData: [],
        extPurchaseData: [],
        extSalesData: [],
        nujenPurchaseData: [],
        nujenSalesData: [],
        vatCardData: [],
        isVatAuthorized: sessionStorage.getItem('vat_authorized') === 'true',
        charts: {}
    };

    const DEFAULT_VAT_CARD_DATA = [
        { month: '2026-01', dedCount: 21, dedSupply: 244097, dedTax: 24403, dedTotal: 268500, totCount: 116, totSupply: 3689117, totTax: 341133, totTotal: 4030250 },
        { month: '2026-02', dedCount: 11, dedSupply: 830275, dedTax: 83025, dedTotal: 913300, totCount: 81, totSupply: 2644540, totTax: 240600, totTotal: 2885140 },
        { month: '2026-03', dedCount: 8, dedSupply: 131457, dedTax: 13143, dedTotal: 144600, totCount: 105, totSupply: 2214410, totTax: 205840, totTotal: 2420250 },
        { month: '2026-04', dedCount: 16, dedSupply: 520729, dedTax: 52071, dedTotal: 572800, totCount: 131, totSupply: 4093245, totTax: 275505, totTotal: 4368750 },
        { month: '2026-05', dedCount: 11, dedSupply: 247356, dedTax: 24734, dedTotal: 272090, totCount: 106, totSupply: 2954198, totTax: 271936, totTotal: 3226134 },
        { month: '2026-06', dedCount: 0, dedSupply: 0, dedTax: 0, dedTotal: 0, totCount: 0, totSupply: 3837825, totTax: 383782, totTotal: 4221607 }
    ];

    const EXT_CATEGORIES = [
        { id: 'starter_192', code: 'EXT1000S', name: 'ExT Starter Pack (192 rxn)', spec: '192 reactions [set]', initQty: 0, initAmount: 0, unitPrice: 8500000 },
        { id: 'starter_96', code: 'EXT1000S(Demo)', name: 'ExT Starter Pack (96 rxn)', spec: '96 reactions [set]', initQty: 0, initAmount: 0, unitPrice: 7225000 },
        { id: 'kit_10_25', code: 'EXT1025K', name: 'ExT 10 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 420000 },
        { id: 'kit_100_25', code: 'EXT10025K', name: 'ExT 100 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 420000 },
        { id: 'kit_10_96', code: 'EXT1096K', name: 'ExT 10 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 1250000 },
        { id: 'kit_100_96', code: 'EXT10096K', name: 'ExT 100 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 1250000 },
        { id: 'tube', code: 'EXT50T', name: 'ExTransfection Tube', spec: 'EXT50T', initQty: 0, initAmount: 0, unitPrice: 280000 }
    ];

    const NUJEN_CATEGORIES = [
        { id: 'ngs_sep_10', code: 'NGS-SEP-10', name: 'NuGen Serological pipette, Stretching, 10ml', spec: '200 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 30000 },
        { id: 'ngs_sep_100', code: 'NGS-SEP-100', name: 'NuGen Serological pipette, Welding, 100ml', spec: '40 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 59500 },
        { id: 'ngs_sep_50', code: 'NGS-SEP-50', name: 'NuGen Serological pipette, Welding, 50ml', spec: '75 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 49000 },
        { id: 'ngs_sep_25', code: 'NGS-SEP-25', name: 'NuGen Serological pipette, Welding, 25ml', spec: '100 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 28000 },
        { id: 'ngs_sep_5', code: 'NGS-SEP-5', name: 'NuGen Serological pipette, Stretching, 5ml', spec: '200 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 30000 },
        { id: 'ng_stag_1250_rts_er', code: 'NG-STAG-1250-RTS-ER', name: 'NuGen AG Tip, Empty rack, 1250ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2500 },
        { id: 'ng_stag_200_trs_er', code: 'NG-STAG-200-TRS-ER', name: 'NuGen AG Tip, Empty rack, 200ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2000 },
        { id: 'ng_stag_10_rts_er', code: 'NG-STAG-10-RTS-ER', name: 'NuGen AG Tip, Empty rack, 10ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2000 },
        { id: 'ng_stag_1250_rs', code: 'NG-STAG-1250-RS', name: 'NuGen AG Tip, 1250ul, Nature, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 3200 },
        { id: 'ng_stag_200_rs', code: 'NG-STAG-200-RS', name: 'NuGen AG Tip, 200ul, Yellow, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
        { id: 'ng_stag_10l_rs', code: 'NG-STAG-10L-RS', name: 'NuGen AG Tip, 10ul, Extra Long, Nature', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
        { id: 'ng_stag_10_rs', code: 'NG-STAG-10-RS', name: 'NuGen AG Tip, 10ul, Nature, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
        { id: 'ng_stag_1250_rts', code: 'NG-STAG-1250-RTS', name: 'NuGen AG Refill Tip, 1250ul, Nature', spec: '480 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 12500 },
        { id: 'ng_stag_200_rts', code: 'NG-STAG-200-RTS', name: 'NuGen AG Refill Tip, 200ul, Yellow', spec: '960 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 16000 },
        { id: 'ng_stag_10_rts', code: 'NG-STAG-10-RTS', name: 'NuGen AG Refill Tip, 10ul, Nature', spec: '960 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 16000 },
        { id: 'ng_ct_3050_s', code: 'NG-CT-3050-S', name: 'NuGen 50ml Centrifuge Tube, Sterile', spec: '25 PCS/Bag, 500PCS/Box', initQty: 0, initAmount: 0, unitPrice: 60000 },
        { id: 'ng_ct_3015_s', code: 'NG-CT-3015-S', name: 'NuGen 15ml Centrifuge Tube, Sterile', spec: '25 PCS/Bag, 500PCS/Box', initQty: 0, initAmount: 0, unitPrice: 44800 }
    ];

    // ===== CSV 파싱 =====
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
                if (inQuotes) {
                    currentLine += ch;
                }
            } else {
                currentLine += ch;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
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

    function parseCSV(text, skipRows = 1) {
        const lines = parseCSVTextIntoLines(text);
        const headers = parseCSVLine(lines[skipRows - 1]);
        const data = [];
        for (let i = skipRows; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length > 1 && values[0]) {
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx] || '';
                });
                data.push(row);
            }
        }
        return data;
    }

    function parseAmount(str) {
        if (!str) return 0;
        const cleaned = str.replace(/[,\s]/g, '');
        return parseInt(cleaned, 10) || 0;
    }

    // ===== ExT 제품 코드 표준화 =====
    function normalizeExtCode(code) {
        if (!code) return '';
        let clean = code.replace(/[\s\r\n]+/g, '').toUpperCase();
        if (clean === 'EXT-10025K(지역)' || clean === 'EXT-10025K' || clean === 'EXT10025K(할증)' || clean === 'EXT10025K') {
            return 'EXT10025K';
        }
        if (clean === 'EXT-10096K(지역)' || clean === 'EXT-10096K' || clean === 'EXT10096K(할증)' || clean === 'EXT10096K') {
            return 'EXT10096K';
        }
        if (clean === 'EXT-1096K' || clean === 'EXT1096K(할증)' || clean === 'EXT1096K') {
            return 'EXT1096K';
        }
        if (clean === 'EXT-1025K' || clean === 'EXT1025K(할증)' || clean === 'EXT1025K') {
            return 'EXT1025K';
        }
        if (clean === 'EXT1001S' || clean === 'EXT1000S') {
            return 'EXT1000S';
        }
        if (clean === 'DEMO_VERSION' || clean === 'DEMOVERSION' || clean === 'EXT1000S(DEMO)') {
            return 'EXT1000S(Demo)';
        }
        return clean;
    }

    // ===== 데이터 로드 =====
    async function loadData() {
        try {
            const t = Date.now();
            const [salesRes, cardRes, purchaseRes, extPurchaseRes, extSalesRes, nujenPurchaseRes, nujenSalesRes] = await Promise.all([
                fetch(`매출.csv?v=${t}`),
                fetch(`카드매출전표.csv?v=${t}`),
                fetch(`매입.csv?v=${t}`),
                fetch(`ExT구매현항.csv?v=${t}`),
                fetch(`ExT판매현황_수정.csv?v=${t}`),
                fetch(`뉴진스제품 구매현황.csv?v=${t}`),
                fetch(`뉴진스제품 판매현황.csv?v=${t}`)
            ]);

            const salesText = await salesRes.text();
            const cardText = await cardRes.text();
            const purchaseText = await purchaseRes.text();
            const extPurchaseText = await extPurchaseRes.text();
            const extSalesText = await extSalesRes.text();
            const nujenPurchaseText = await nujenPurchaseRes.text();
            const nujenSalesText = await nujenSalesRes.text();

            // 매출 CSV: 1행=제목, 2행=헤더
            state.salesData = parseCSV(salesText, 2).map(row => ({
                date: row['작성일자'] || '',
                approvalNo: row['승인번호'] || '',
                issueDate: row['발급일자'] || '',
                supplierBizNo: row['공급자사업자등록번호'] || '',
                supplierName: row['상호'] || '',
                buyerBizNo: row['공급받는자사업자등록번호'] || '',
                buyerName: (function() {
                    // 공급받는자 상호 is at index 11
                    const values = parseCSVLine(Object.values(row).join(','));
                    return row['대표자명'] || '';
                })(),
                totalAmount: parseAmount(row['합계금액']),
                supplyAmount: parseAmount(row['공급가액']),
                taxAmount: parseAmount(row['세액']),
                classification: row['전자세금계산서분류'] || '',
                type: row['전자세금계산서종류'] || '',
                itemName: row['품목명'] || '',
                itemSpec: row['품목규격'] || '',
                itemQty: row['품목수량'] || '',
                itemUnitPrice: row['품목단가'] || '',
                raw: row
            }));

            // 매출 CSV를 다시 제대로 파싱 (원본 라인에서 직접 파싱)
            const salesLines = parseCSVTextIntoLines(salesText);
            state.salesData = [];
            for (let i = 2; i < salesLines.length; i++) {
                const v = parseCSVLine(salesLines[i]);
                if (v.length < 15 || !v[0]) continue;
                state.salesData.push({
                    date: v[0],
                    approvalNo: v[1],
                    issueDate: v[2],
                    sendDate: v[3],
                    supplierBizNo: v[4],
                    supplierName: v[6],
                    supplierCeo: v[7],
                    buyerBizNo: v[9],
                    buyerName: v[11],
                    buyerCeo: v[12],
                    buyerAddr: v[13],
                    totalAmount: parseAmount(v[14]),
                    supplyAmount: parseAmount(v[15]),
                    taxAmount: parseAmount(v[16]),
                    classification: v[17],
                    type: v[18],
                    issueType: v[19],
                    note: v[20],
                    receiptType: v[21],
                    itemDate: v[25],
                    itemName: v[26],
                    itemSpec: v[27],
                    itemQty: v[28],
                    itemUnitPrice: v[29],
                    itemSupply: v[30],
                    itemTax: v[31]
                });
            }

            // 카드매출 CSV: 1-2행=헤더정보, 3행=헤더
            const cardLines = parseCSVTextIntoLines(cardText);
            state.cardSalesData = [];
            for (let i = 3; i < cardLines.length; i++) {
                const v = parseCSVLine(cardLines[i]);
                if (!v[0] || v[0] === '총계') continue;
                state.cardSalesData.push({
                    date: v[0],
                    totalAmount: parseAmount(v[1]),
                    totalCount: parseInt(v[2]) || 0,
                    approvedAmount: parseAmount(v[3]),
                    approvedCount: parseInt(v[4]) || 0,
                    cancelledAmount: parseAmount(v[5]),
                    cancelledCount: parseInt(v[6]) || 0
                });
            }

            // 매입 CSV
            const purchaseLines = parseCSVTextIntoLines(purchaseText);
            state.purchaseData = [];
            for (let i = 2; i < purchaseLines.length; i++) {
                const v = parseCSVLine(purchaseLines[i]);
                if (v.length < 15 || !v[0]) continue;
                state.purchaseData.push({
                    date: v[0],
                    approvalNo: v[1],
                    issueDate: v[2],
                    sendDate: v[3],
                    supplierBizNo: v[4],
                    supplierName: v[6],
                    supplierCeo: v[7],
                    supplierAddr: v[8],
                    buyerBizNo: v[9],
                    buyerName: v[11],
                    buyerCeo: v[12],
                    totalAmount: parseAmount(v[14]),
                    supplyAmount: parseAmount(v[15]),
                    taxAmount: parseAmount(v[16]),
                    classification: v[17],
                    type: v[18],
                    issueType: v[19],
                    note: v[20],
                    receiptType: v[21],
                    itemDate: v[25],
                    itemName: v[26],
                    itemSpec: v[27],
                    itemQty: v[28],
                    itemUnitPrice: v[29],
                    itemSupply: v[30],
                    itemTax: v[31]
                });
            }

            // ExT구매현항 CSV 파싱
            const extPurchaseLines = parseCSVTextIntoLines(extPurchaseText);
            state.extPurchaseData = [];
            for (let i = 1; i < extPurchaseLines.length; i++) {
                const v = parseCSVLine(extPurchaseLines[i]);
                if (!v[0] || v[0].startsWith('총합계')) continue;
                state.extPurchaseData.push({
                    dateNo: v[0],
                    supplier: v[1],
                    code: normalizeExtCode(v[2]),
                    name: v[3],
                    qty: parseInt(v[4]) || 0,
                    unitPrice: parseAmount(v[5]),
                    supplyAmount: parseAmount(v[6]),
                    taxAmount: parseAmount(v[7]),
                    totalAmount: parseAmount(v[6]) + parseAmount(v[7])
                });
            }

            // ExT판매현황 CSV 파싱
            const extSalesLines = parseCSVTextIntoLines(extSalesText);
            state.extSalesData = [];
            
            // 헤더 정보 파악
            let extSalesDateIdx = 0;
            let extSalesBuyerIdx = 1;
            let extSalesQtyIdx = 2;
            let extSalesPriceIdx = 3;
            let extSalesSupplyIdx = 4;
            let extSalesTaxIdx = 5;
            let extSalesTotalIdx = 6;
            let extSalesCodeIdx = 7;
            let extSalesNameIdx = 8;
            let extSalesCollectionIdx = -1;
            
            if (extSalesLines.length > 1) {
                const headers = parseCSVLine(extSalesLines[1]);
                extSalesDateIdx = headers.indexOf('일자-No.');
                extSalesBuyerIdx = headers.indexOf('거래처명');
                extSalesCollectionIdx = headers.indexOf('수금일');
                extSalesQtyIdx = headers.indexOf('수량');
                extSalesPriceIdx = headers.indexOf('단가');
                extSalesSupplyIdx = headers.indexOf('공급가액');
                extSalesTaxIdx = headers.indexOf('부가세');
                extSalesTotalIdx = headers.indexOf('합계');
                extSalesCodeIdx = headers.indexOf('품목코드');
                extSalesNameIdx = headers.indexOf('품목명(규격)');
                
                // Fallbacks if header is not matched (for safety)
                if (extSalesDateIdx === -1) extSalesDateIdx = 0;
                if (extSalesBuyerIdx === -1) extSalesBuyerIdx = 1;
                if (extSalesQtyIdx === -1) extSalesQtyIdx = extSalesCollectionIdx !== -1 ? 3 : 2;
                if (extSalesPriceIdx === -1) extSalesPriceIdx = extSalesCollectionIdx !== -1 ? 4 : 3;
                if (extSalesSupplyIdx === -1) extSalesSupplyIdx = extSalesCollectionIdx !== -1 ? 5 : 4;
                if (extSalesTaxIdx === -1) extSalesTaxIdx = extSalesCollectionIdx !== -1 ? 6 : 5;
                if (extSalesTotalIdx === -1) extSalesTotalIdx = extSalesCollectionIdx !== -1 ? 7 : 6;
                if (extSalesCodeIdx === -1) extSalesCodeIdx = extSalesCollectionIdx !== -1 ? 8 : 7;
                if (extSalesNameIdx === -1) extSalesNameIdx = extSalesCollectionIdx !== -1 ? 9 : 8;
            }
            
            for (let i = 2; i < extSalesLines.length; i++) {
                const v = parseCSVLine(extSalesLines[i]);
                if (!v[0] || v[0].startsWith('총합계')) continue;
                state.extSalesData.push({
                    dateNo: v[extSalesDateIdx] || '',
                    buyer: v[extSalesBuyerIdx] || '',
                    collectionDate: extSalesCollectionIdx !== -1 ? (v[extSalesCollectionIdx] || '') : '',
                    qty: parseInt(v[extSalesQtyIdx]) || 0,
                    unitPrice: parseAmount(v[extSalesPriceIdx]),
                    supplyAmount: parseAmount(v[extSalesSupplyIdx]),
                    taxAmount: parseAmount(v[extSalesTaxIdx]),
                    totalAmount: parseAmount(v[extSalesTotalIdx]),
                    code: normalizeExtCode(v[extSalesCodeIdx]),
                    name: v[extSalesNameIdx] || ''
                });
            }

            // 뉴진스제품 구매현황 CSV 파싱
            const nujenPurchaseLines = parseCSVTextIntoLines(nujenPurchaseText);
            state.nujenPurchaseData = [];
            for (let i = 2; i < nujenPurchaseLines.length; i++) {
                const v = parseCSVLine(nujenPurchaseLines[i]);
                if (!v[0] || v[0].startsWith('총합계') || v[0].startsWith('총계') || v[0].includes('오후')) continue;
                state.nujenPurchaseData.push({
                    dateNo: v[0],
                    supplier: v[1],
                    code: v[3],
                    name: v[4],
                    qty: parseInt(v[5]) || 0,
                    unitPrice: parseAmount(v[6]),
                    supplyAmount: parseAmount(v[7]),
                    taxAmount: parseAmount(v[8]),
                    totalAmount: parseAmount(v[9])
                });
            }

            // 뉴진스제품 판매현황 CSV 파싱
            const nujenSalesLines = parseCSVTextIntoLines(nujenSalesText);
            state.nujenSalesData = [];
            for (let i = 1; i < nujenSalesLines.length; i++) {
                const v = parseCSVLine(nujenSalesLines[i]);
                if (!v[0] || v[0].startsWith('총합계') || v[0].startsWith('총계') || v[0].includes('오후')) continue;
                state.nujenSalesData.push({
                    dateNo: v[0],
                    buyer: v[1],
                    qty: parseInt(v[2]) || 0,
                    unitPrice: parseAmount(v[3]),
                    supplyAmount: parseAmount(v[4]),
                    taxAmount: parseAmount(v[5]),
                    totalAmount: parseAmount(v[6]),
                    code: v[7],
                    name: v[8]
                });
            }

            // 3분기 제외 필터링 (2026년 2분기인 2026/06/30 까지만 반영)
            const cutoffDate = "2026/06/30";
            function filterCutoff(d, dateField) {
                if (!d[dateField]) return true;
                const clean = d[dateField].split(' ')[0].replace(/-/g, '/');
                return clean <= cutoffDate;
            }

            state.salesData = state.salesData.filter(d => filterCutoff(d, 'date'));
            state.cardSalesData = state.cardSalesData.filter(d => filterCutoff(d, 'date'));
            state.purchaseData = state.purchaseData.filter(d => filterCutoff(d, 'date'));
            state.extSalesData = state.extSalesData.filter(d => filterCutoff(d, 'dateNo'));
            state.extPurchaseData = state.extPurchaseData.filter(d => filterCutoff(d, 'dateNo'));
            state.nujenSalesData = state.nujenSalesData.filter(d => filterCutoff(d, 'dateNo'));
            state.nujenPurchaseData = state.nujenPurchaseData.filter(d => filterCutoff(d, 'dateNo'));

            // 부가세 카드 데이터 로드
            const savedVatData = localStorage.getItem('vat_card_data');
            if (savedVatData) {
                try {
                    state.vatCardData = JSON.parse(savedVatData);
                } catch(e) {
                    state.vatCardData = JSON.parse(JSON.stringify(DEFAULT_VAT_CARD_DATA));
                }
            } else {
                state.vatCardData = JSON.parse(JSON.stringify(DEFAULT_VAT_CARD_DATA));
            }

            // 배지 업데이트
            document.getElementById('badge-sales').textContent = state.salesData.length;
            document.getElementById('badge-inventory').textContent = '7'; // ExT 제품군 수
            document.getElementById('badge-nujen').textContent = '10'; // 뉴진스 제품군 수
            document.getElementById('badge-card-sales').textContent = state.cardSalesData.length;
            document.getElementById('badge-purchases').textContent = state.purchaseData.length;
            document.getElementById('badge-vat').textContent = state.vatCardData.length;

            // 기간 정보
            const allDates = [
                ...state.salesData.map(d => d.date),
                ...state.cardSalesData.map(d => d.date),
                ...state.purchaseData.map(d => d.date)
            ].filter(d => d).sort();
            if (allDates.length) {
                document.getElementById('data-period').textContent =
                    `${allDates[0]} ~ ${allDates[allDates.length - 1]}`;
            }

        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    }

    // ===== ExT 제품 필터 =====
    function isExtProduct(row) {
        const name = (row.itemName || '').toLowerCase();
        return name.includes('extransfection') || name.includes('ext-') || name.includes('exttransfection') || name.includes('starter pack');
    }

    // ===== 뉴진스 제품 분류 =====
    function classifyNujenProduct(code, name) {
        const c = (code || '').toUpperCase().trim();
        const n = (name || '').toLowerCase();

        // 1대1 코드 매치
        if (c === 'NGS-SEP-10' || c === 'NG-SEP-10') return 'ngs_sep_10';
        if (c === 'NGS-SEP-100' || c === 'NG-SEP-100') return 'ngs_sep_100';
        if (c === 'NGS-SEP-50' || c === 'NG-SEP-50') return 'ngs_sep_50';
        if (c === 'NGS-SEP-25' || c === 'NG-SEP-25') return 'ngs_sep_25';
        if (c === 'NGS-SEP-5' || c === 'NG-SEP-5') return 'ngs_sep_5';

        if (c === 'NG-STAG-1250-RTS-ER' || c === 'NGS-STAG-1250-RTS-ER') return 'ng_stag_1250_rts_er';
        if (c === 'NG-STAG-200-TRS-ER' || c === 'NG-STAG-200-TRS' || c.includes('200-TRS-ER')) return 'ng_stag_200_trs_er';
        if (c === 'NG-STAG-10-RTS-ER' || c.includes('10-RTS-ER')) return 'ng_stag_10_rts_er';

        // 팁 1250ul Racked
        if (c === 'NG-STAG-1250-RS' || c === 'NGS-STAG-1250-RS' || c === 'NGS-STAG1250-RS') return 'ng_stag_1250_rs';
        // 팁 200ul Racked
        if (c === 'NG-STAG-200-RS' || c === 'NGS-STAG-200-RS') return 'ng_stag_200_rs';
        // 팁 10ul Extra Long Racked
        if (c === 'NG-STAG-10L-RS' || c === 'NGS-STAG-10L-RS') return 'ng_stag_10l_rs';
        // 팁 10ul Racked
        if (c === 'NG-STAG-10-RS' || c === 'NGS-STAG-10-RS') return 'ng_stag_10_rs';

        // 팁 1250ul Refill
        if (c === 'NG-STAG-1250-RTS' || c === 'NGS-STAG-1250-RTS' || c === 'NGS-STAG1250-RS-2') return 'ng_stag_1250_rts';
        // 팁 200ul Refill
        if (c === 'NG-STAG-200-RTS' || c === 'NGS-STAG-200-RTS') return 'ng_stag_200_rts';
        // 팁 10ul Refill
        if (c === 'NG-STAG-10-RTS' || c === 'NGS-STAG-10-RTS') return 'ng_stag_10_rts';

        // Centrifuge Tubes
        if (c === 'NG-CT-3050-S' || c === 'NGS-CT-3050-S') return 'ng_ct_3050_s';
        if (c === 'NG-CT-3015-S' || c === 'NGS-CT-3015-S') return 'ng_ct_3015_s';

        // fallback keyword 매치
        if (n.includes('serological') && n.includes('100ml')) return 'ngs_sep_100';
        if (n.includes('serological') && n.includes('50ml')) return 'ngs_sep_50';
        if (n.includes('serological') && n.includes('25ml')) return 'ngs_sep_25';
        if (n.includes('serological') && n.includes('10ml')) return 'ngs_sep_10';
        if (n.includes('serological') && n.includes('5ml')) return 'ngs_sep_5';
        if (n.includes('centrifuge') && n.includes('50ml')) return 'ng_ct_3050_s';
        if (n.includes('centrifuge') && n.includes('15ml')) return 'ng_ct_3015_s';
        if (n.includes('refill') && n.includes('1250')) return 'ng_stag_1250_rts';
        if (n.includes('refill') && n.includes('200')) return 'ng_stag_200_rts';
        if (n.includes('refill') && n.includes('10')) return 'ng_stag_10_rts';
        if (n.includes('racked') && n.includes('1250')) return 'ng_stag_1250_rs';
        if (n.includes('racked') && n.includes('200')) return 'ng_stag_200_rs';
        if (n.includes('racked') && n.includes('10')) return 'ng_stag_10_rs';

        return null;
    }

    // ===== NuGen 글로벌 기간 필터 적용 =====
    function getFilteredNujenSalesData() {
        const data = state.nujenSalesData;
        if (state.currentPeriod === 'all' || !state.selectedSubPeriod) {
            return data;
        }
        return data.filter(r => {
            if (!r.dateNo) return false;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (!m) return false;
            const year = m[1];
            const month = parseInt(m[2], 10);
            if (state.currentPeriod === 'monthly') {
                const targetStr = `${year}-${m[2]}`;
                return targetStr === state.selectedSubPeriod;
            } else if (state.currentPeriod === 'quarterly') {
                const q = Math.ceil(month / 3);
                const targetStr = `${year}-Q${q}`;
                return targetStr === state.selectedSubPeriod;
            }
            return true;
        });
    }

    // ===== NuGen 누적 매출 필터 (기말 재고 계산용) =====
    function getAccumulatedNujenSalesData() {
        const data = state.nujenSalesData;
        if (state.currentPeriod === 'all' || !state.selectedSubPeriod) {
            return data;
        }
        return data.filter(r => {
            if (!r.dateNo) return false;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (!m) return false;
            const year = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            
            if (state.currentPeriod === 'monthly') {
                const [targetYear, targetMonth] = state.selectedSubPeriod.split('-').map(Number);
                if (year < targetYear) return true;
                if (year === targetYear && month <= targetMonth) return true;
                return false;
            } else if (state.currentPeriod === 'quarterly') {
                const [targetYear, targetQStr] = state.selectedSubPeriod.split('-Q');
                const targetYearNum = parseInt(targetYear, 10);
                const targetQ = parseInt(targetQStr, 10);
                const q = Math.ceil(month / 3);
                
                if (year < targetYearNum) return true;
                if (year === targetYearNum && q <= targetQ) return true;
                return false;
            }
            return true;
        });
    }

    // ===== ExT 글로벌 기간 필터 적용 =====
    function getFilteredExtSalesData() {
        const data = state.extSalesData;
        if (state.currentPeriod === 'all' || !state.selectedSubPeriod) {
            return data;
        }
        return data.filter(r => {
            if (!r.dateNo) return false;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (!m) return false;
            const year = m[1];
            const month = parseInt(m[2], 10);
            if (state.currentPeriod === 'monthly') {
                const targetStr = `${year}-${m[2]}`; // YYYY-MM
                return targetStr === state.selectedSubPeriod;
            } else if (state.currentPeriod === 'quarterly') {
                const q = Math.ceil(month / 3);
                const targetStr = `${year}-Q${q}`; // YYYY-Q#
                return targetStr === state.selectedSubPeriod;
            }
            return true;
        });
    }

    // ===== ExT 누적 매출 필터 (기말 재고 계산용) =====
    function getAccumulatedExtSalesData() {
        const data = state.extSalesData;
        if (state.currentPeriod === 'all' || !state.selectedSubPeriod) {
            return data;
        }
        return data.filter(r => {
            if (!r.dateNo) return false;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (!m) return false;
            const year = parseInt(m[1], 10);
            const month = parseInt(m[2], 10);
            
            if (state.currentPeriod === 'monthly') {
                const [targetYear, targetMonth] = state.selectedSubPeriod.split('-').map(Number);
                if (year < targetYear) return true;
                if (year === targetYear && month <= targetMonth) return true;
                return false;
            } else if (state.currentPeriod === 'quarterly') {
                const [targetYear, targetQStr] = state.selectedSubPeriod.split('-Q');
                const targetYearNum = parseInt(targetYear, 10);
                const targetQ = parseInt(targetQStr, 10);
                const q = Math.ceil(month / 3);
                
                if (year < targetYearNum) return true;
                if (year === targetYearNum && q <= targetQ) return true;
                return false;
            }
            return true;
        });
    }

    // ===== 유틸리티 =====
    function formatCurrency(amount) {
        if (amount === 0) return '0원';
        const sign = amount < 0 ? '-' : '';
        return sign + Math.abs(amount).toLocaleString() + '원';
    }

    function formatFullCurrency(amount) {
        const sign = amount < 0 ? '-' : '';
        return sign + Math.abs(amount).toLocaleString() + '원';
    }

    // ===== 품목명/코드 크게 보기 팝업 띄우기 (차트 인터랙션) =====
    function showLargeLabelPopup(code, name, rate) {
        let toast = document.getElementById('chart-large-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'chart-large-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: #eff6ff; /* Soft light-blue background */
                border: 2px solid var(--accent-blue); /* Blue border */
                box-shadow: var(--shadow-lg);
                border-radius: var(--radius-lg);
                padding: 16px 24px;
                z-index: 9999;
                max-width: 90%;
                width: 480px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-tertiary); font-weight:600;">${code}</span>
                <span class="tag normal" style="background:rgba(59,130,246,0.1); color:var(--accent-blue); font-weight:700; font-size:0.85rem; padding:4px 8px; border-radius:6px; margin: 0;">판매율 ${rate.toFixed(1)}%</span>
            </div>
            <div style="font-size:1.2rem; font-weight:800; color:var(--text-primary); line-height:1.4; word-break:keep-all; margin-right: 20px;">
                ${name}
            </div>
            <button id="btn-close-toast"
                    style="position:absolute; top:8px; right:8px; background:none; border:none; color:var(--text-tertiary); cursor:pointer; padding:4px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        toast.querySelector('#btn-close-toast').onclick = (e) => {
            e.stopPropagation();
            toast.style.opacity = '0';
            toast.style.visibility = 'hidden';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        };

        // Trigger show animation
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.visibility = 'visible';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);

        // Auto hide after 8 seconds
        if (toast.timeoutId) clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.visibility = 'hidden';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 8000);
    }

    function getMonth(dateStr) {
        if (!dateStr) return null;
        return dateStr.substring(0, 7); // YYYY-MM
    }

    function getQuarter(dateStr) {
        if (!dateStr) return null;
        const month = parseInt(dateStr.substring(5, 7));
        const q = Math.ceil(month / 3);
        return `${dateStr.substring(0, 4)}-Q${q}`;
    }

    function getQuarterLabel(q) {
        const parts = q.split('-Q');
        return `${parts[0]}년 ${parts[1]}분기`;
    }

    function getMonthLabel(m) {
        const parts = m.split('-');
        return `${parts[0]}년 ${parseInt(parts[1])}월`;
    }

    function getFilteredData(data) {
        if (state.currentPeriod === 'all') return data;

        return data.filter(item => {
            if (!item.date) return false;
            if (state.currentPeriod === 'monthly') {
                return getMonth(item.date) === state.selectedSubPeriod;
            } else if (state.currentPeriod === 'quarterly') {
                return getQuarter(item.date) === state.selectedSubPeriod;
            }
            return true;
        });
    }

    function getAvailablePeriods(periodType) {
        const allDates = [
            ...state.salesData.map(d => d.date),
            ...state.cardSalesData.map(d => d.date),
            ...state.purchaseData.map(d => d.date)
        ].filter(d => d);

        const periods = new Set();
        allDates.forEach(d => {
            if (periodType === 'monthly') {
                periods.add(getMonth(d));
            } else if (periodType === 'quarterly') {
                periods.add(getQuarter(d));
            }
        });

        return [...periods].sort().reverse();
    }

    // ===== 서머리 카드 생성 =====
    function createSummaryCard(color, icon, label, value, sub) {
        return `
            <div class="summary-card ${color}">
                <div class="summary-card-icon">${icon}</div>
                <div class="summary-card-label">${label}</div>
                <div class="summary-card-value">${value}</div>
                ${sub ? `<div class="summary-card-sub">${sub}</div>` : ''}
            </div>
        `;
    }

    const ICONS = {
        sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        purchase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
        profit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
        count: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    };

    // ===== 대시보드 렌더 =====

    function renderSummaryCards() {
        const sales = getFilteredData(state.salesData);
        const cards = getFilteredData(state.cardSalesData);
        const purchases = getFilteredData(state.purchaseData);

        const totalSales = sales.reduce((s, r) => s + r.totalAmount, 0);
        const totalSupply = sales.reduce((s, r) => s + r.supplyAmount, 0);
        const totalSalesTax = sales.reduce((s, r) => s + r.taxAmount, 0);
        
        const totalCardSales = cards.reduce((s, r) => s + r.totalAmount, 0);
        const cardSalesTax = Math.round(totalCardSales / 11);
        const cardSalesSupply = totalCardSales - cardSalesTax;
        const totalCardCount = cards.reduce((s, r) => s + r.totalCount, 0);
        
        const totalPurchases = purchases.reduce((s, r) => s + r.totalAmount, 0);
        const totalPurchaseSupply = purchases.reduce((s, r) => s + r.supplyAmount, 0);
        const totalPurchaseTax = purchases.reduce((s, r) => s + r.taxAmount, 0);
        
        const profit = (totalSupply + cardSalesSupply) - totalPurchaseSupply;
        const profitRate = (totalSupply + cardSalesSupply) !== 0 ? ((profit / (totalSupply + cardSalesSupply)) * 100).toFixed(1) : '0.0';

        const html = [
            createSummaryCard('indigo', ICONS.sales, '매출 합계',
                formatCurrency(totalSales),
                `공급가액: ${formatCurrency(totalSupply)} · 부가세: ${formatCurrency(totalSalesTax)} · ${sales.length}건`),
            createSummaryCard('blue', ICONS.card, '카드매출 합계',
                formatCurrency(totalCardSales),
                `공급가액: ${formatCurrency(cardSalesSupply)} · 부가세: ${formatCurrency(cardSalesTax)} · ${totalCardCount}건`),
            createSummaryCard('rose', ICONS.purchase, '매입 합계',
                formatCurrency(totalPurchases),
                `공급가액: ${formatCurrency(totalPurchaseSupply)} · 부가세: ${formatCurrency(totalPurchaseTax)} · ${purchases.length}건`),
            createSummaryCard('emerald', ICONS.profit, '손익 (공급가액 기준)',
                formatCurrency(profit),
                profit >= 0
                    ? `<span class="positive">▲ 흑자 (${profitRate}%)</span>`
                    : `<span class="negative">▼ 적자 (${profitRate}%)</span>`)
        ].join('');

        document.getElementById('summary-cards').innerHTML = html;
    }

    function renderDashboard() {
        renderSummaryCards();
        if (state.currentPeriod === 'quarterly') {
            renderDashboardQuarterly();
        } else {
            renderDashboardMonthly();
        }
    }

    function formatShortCurrency(amount) {
        const abs = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';
        if (abs >= 100000000) {
            return sign + (abs / 100000000).toFixed(1) + '억';
        } else if (abs >= 10000) {
            return sign + (abs / 10000).toFixed(1) + '만';
        }
        return sign + abs.toLocaleString();
    }

    function renderDashboardMonthly() {
        const months = new Set();
        state.salesData.forEach(r => { const m = getMonth(r.date); if (m) months.add(m); });
        state.cardSalesData.forEach(r => { const m = getMonth(r.date); if (m) months.add(m); });
        state.purchaseData.forEach(r => { const m = getMonth(r.date); if (m) months.add(m); });
        const sortedMonths = [...months].sort();

        const salesByMonth = {};
        const purchasesByMonth = {};
        sortedMonths.forEach(m => { salesByMonth[m] = 0; purchasesByMonth[m] = 0; });
        state.salesData.forEach(r => {
            const m = getMonth(r.date);
            if (m) salesByMonth[m] = (salesByMonth[m] || 0) + r.totalAmount;
        });
        state.cardSalesData.forEach(r => {
            const m = getMonth(r.date);
            if (m) salesByMonth[m] = (salesByMonth[m] || 0) + r.totalAmount;
        });
        state.purchaseData.forEach(r => {
            const m = getMonth(r.date);
            if (m) purchasesByMonth[m] = (purchasesByMonth[m] || 0) + r.totalAmount;
        });

        const profitData = sortedMonths.map(m => ({
            label: parseInt(m.split('-')[1]) + '월',
            sales: salesByMonth[m] || 0,
            purchases: purchasesByMonth[m] || 0,
            profit: (salesByMonth[m] || 0) - (purchasesByMonth[m] || 0),
            key: m
        }));

        document.getElementById('profit-trend-desc').textContent =
            '2026년 상반기 월별 영업 이익(매출 - 매입) 현황입니다.';

        renderProfitBars(profitData);
        renderSummaryTable(profitData);
    }

    function renderDashboardQuarterly() {
        const quarters = new Set();
        state.salesData.forEach(r => { const q = getQuarter(r.date); if (q) quarters.add(q); });
        state.cardSalesData.forEach(r => { const q = getQuarter(r.date); if (q) quarters.add(q); });
        state.purchaseData.forEach(r => { const q = getQuarter(r.date); if (q) quarters.add(q); });
        const sortedQuarters = [...quarters].sort();

        const salesByQ = {};
        const purchasesByQ = {};
        sortedQuarters.forEach(q => { salesByQ[q] = 0; purchasesByQ[q] = 0; });
        state.salesData.forEach(r => {
            const q = getQuarter(r.date);
            if (q) salesByQ[q] = (salesByQ[q] || 0) + r.totalAmount;
        });
        state.cardSalesData.forEach(r => {
            const q = getQuarter(r.date);
            if (q) salesByQ[q] = (salesByQ[q] || 0) + r.totalAmount;
        });
        state.purchaseData.forEach(r => {
            const q = getQuarter(r.date);
            if (q) purchasesByQ[q] = (purchasesByQ[q] || 0) + r.totalAmount;
        });

        const profitData = sortedQuarters.map(q => {
            const parts = q.split('-Q');
            return {
                label: parts[1] + '분기',
                sales: salesByQ[q] || 0,
                purchases: purchasesByQ[q] || 0,
                profit: (salesByQ[q] || 0) - (purchasesByQ[q] || 0),
                key: q
            };
        });

        document.getElementById('profit-trend-desc').textContent =
            '2026년 분기별 영업 이익(매출 - 매입) 현황입니다.';

        renderProfitBars(profitData);
        renderSummaryTable(profitData);
    }

    function renderProfitBars(profitData) {
        const maxAbs = Math.max(...profitData.map(d => Math.abs(d.profit)), 1);
        const maxBarHeight = 180;

        const barsHTML = profitData.map(d => {
            const barHeight = Math.max((Math.abs(d.profit) / maxAbs) * maxBarHeight, 8);
            const isPositive = d.profit >= 0;
            const cls = isPositive ? 'positive' : 'negative';
            const valueLabel = formatShortCurrency(d.profit);

            return `
                <div class="profit-bar-item">
                    <span class="profit-bar-value ${cls}">${valueLabel}</span>
                    <div class="profit-bar ${cls}" style="height: ${barHeight}px;"></div>
                    <span class="profit-bar-label">${d.label}</span>
                </div>
            `;
        }).join('');

        document.getElementById('profit-bars').innerHTML = barsHTML;
    }

    function renderSummaryTable(profitData) {
        const reversed = [...profitData].reverse();

        let rows = reversed.map(d => {
            const ratio = d.sales !== 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0.0';
            const profitCls = d.profit >= 0 ? 'profit-positive' : 'profit-negative';
            const ratioCls = parseFloat(ratio) >= 0 ? 'ratio-positive' : 'ratio-negative';

            return `
                <tr>
                    <td>${d.label}</td>
                    <td class="text-right">${d.sales.toLocaleString()}원</td>
                    <td class="text-right">${d.purchases.toLocaleString()}원</td>
                    <td class="text-right ${profitCls}">${d.profit.toLocaleString()}원</td>
                    <td class="text-right ${ratioCls}">${ratio}%</td>
                </tr>
            `;
        }).join('');

        const totalSales = profitData.reduce((s, d) => s + d.sales, 0);
        const totalPurchases = profitData.reduce((s, d) => s + d.purchases, 0);
        const totalProfit = totalSales - totalPurchases;
        const totalRatio = totalSales !== 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
        const totalProfitCls = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
        const totalRatioCls = parseFloat(totalRatio) >= 0 ? 'ratio-positive' : 'ratio-negative';

        rows += `
            <tr class="total-row">
                <td>전체 합계</td>
                <td class="text-right">${totalSales.toLocaleString()}원</td>
                <td class="text-right">${totalPurchases.toLocaleString()}원</td>
                <td class="text-right ${totalProfitCls}">${totalProfit.toLocaleString()}원</td>
                <td class="text-right ${totalRatioCls}">${totalRatio}%</td>
            </tr>
        `;

        document.getElementById('summary-tbody').innerHTML = rows;
    }

    // ===== 매출 세부 렌더 =====
    function renderSalesView(searchTerm = '') {
        const data = getFilteredData(state.salesData);
        const filtered = searchTerm
            ? data.filter(r =>
                (r.buyerName && r.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.itemName && r.itemName.toLowerCase().includes(searchTerm.toLowerCase())))
            : data;

        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);
        const totalSupply = filtered.reduce((s, r) => s + r.supplyAmount, 0);
        const totalTax = filtered.reduce((s, r) => s + r.taxAmount, 0);
        const normalCount = filtered.filter(r => r.classification === '세금계산서').length;
        const correctionCount = filtered.filter(r => r.classification === '수정세금계산서').length;

        document.getElementById('sales-summary-cards').innerHTML = [
            createSummaryCard('indigo', ICONS.sales, '매출 합계금액', formatCurrency(totalAmount), `${filtered.length}건`),
            createSummaryCard('blue', ICONS.profit, '공급가액', formatCurrency(totalSupply), ''),
            createSummaryCard('amber', ICONS.tax, '세액 합계', formatCurrency(totalTax), ''),
            createSummaryCard('purple', ICONS.count, '거래 분류',
                `${normalCount}건`,
                correctionCount > 0 ? `<span class="negative">수정 ${correctionCount}건</span>` : '정상발급')
        ].join('');

        const tbody = document.getElementById('sales-tbody');
        tbody.innerHTML = filtered.map((r, idx) => `
            <tr data-type="sales" data-idx="${state.salesData.indexOf(r)}">
                <td>${r.date}</td>
                <td>${r.buyerName || '-'}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${r.itemName || '-'}</td>
                <td class="text-right amount ${r.totalAmount < 0 ? 'negative' : ''}">${r.totalAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.supplyAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.taxAmount.toLocaleString()}</td>
                <td><span class="tag ${r.classification === '수정세금계산서' ? 'correction' : 'normal'}">${r.classification === '수정세금계산서' ? '수정' : '일반'}</span></td>
            </tr>
        `).join('');

        document.getElementById('sales-footer').innerHTML = `
            <span>${filtered.length}건 조회됨</span>
            <span class="table-footer-total">합계: ${formatFullCurrency(totalAmount)}</span>
        `;
    }

    // ===== ExT 매출 세부내역 렌더 (재고관리 탭 하단용) =====
    function renderExtSalesList(searchTerm = '') {
        const data = getFilteredExtSalesData();
        const filtered = searchTerm
            ? data.filter(r =>
                (r.buyer && r.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase())))
            : data;

        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);

        const tbody = document.getElementById('ext-sales-tbody');
        tbody.innerHTML = filtered.map((r) => `
            <tr data-type="ext-sales" data-idx="${state.extSalesData.indexOf(r)}">
                <td>${r.dateNo.split(' ')[0]}</td>
                <td>${r.buyer || '-'}</td>
                <td style="font-family:monospace;font-size:0.82rem;color:var(--text-secondary);">${r.code || '-'}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${r.name || '-'}</td>
                <td class="text-center">${r.qty.toLocaleString()}</td>
                <td class="text-right amount ${r.totalAmount < 0 ? 'negative' : ''}">${r.totalAmount.toLocaleString()}원</td>
                <td class="text-right amount">${r.supplyAmount.toLocaleString()}원</td>
                <td class="text-right amount">${r.taxAmount.toLocaleString()}원</td>
                <td><span class="tag normal">일반</span></td>
            </tr>
        `).join('');

        document.getElementById('ext-sales-footer').innerHTML = `
            <span>${filtered.length}건 조회됨</span>
            <span class="table-footer-total">합계: ${formatFullCurrency(totalAmount)}</span>
        `;
    }

    // ===== 뉴진스 매출 세부내역 렌더 =====
    function renderNujenSalesList(searchTerm = '') {
        const data = getFilteredNujenSalesData();
        const filtered = searchTerm
            ? data.filter(r =>
                (r.buyer && r.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase())))
            : data;

        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);

        const tbody = document.getElementById('nujen-sales-tbody');
        tbody.innerHTML = filtered.map((r) => `
            <tr data-type="nujen-sales" data-idx="${state.nujenSalesData.indexOf(r)}">
                <td>${r.dateNo.split(' ')[0]}</td>
                <td>${r.buyer || '-'}</td>
                <td style="font-family:monospace;font-size:0.82rem;color:var(--text-secondary);">${r.code || '-'}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${r.name || '-'}</td>
                <td class="text-center">${r.qty.toLocaleString()}</td>
                <td class="text-right amount ${r.totalAmount < 0 ? 'negative' : ''}">${r.totalAmount.toLocaleString()}원</td>
                <td class="text-right amount">${r.supplyAmount.toLocaleString()}원</td>
                <td class="text-right amount">${r.taxAmount.toLocaleString()}원</td>
                <td><span class="tag normal" style="background:rgba(124,58,237,0.1);color:var(--accent-indigo);">뉴진스</span></td>
            </tr>
        `).join('');

        document.getElementById('nujen-sales-footer').innerHTML = `
            <span>${filtered.length}건 조회됨</span>
            <span class="table-footer-total">합계: ${formatFullCurrency(totalAmount)}</span>
        `;
    }

    // ===== 카드매출 세부 렌더 =====
    function renderCardSalesView() {
        const data = getFilteredData(state.cardSalesData);

        const totalAmount = data.reduce((s, r) => s + r.totalAmount, 0);
        const totalApproved = data.reduce((s, r) => s + r.approvedAmount, 0);
        const totalCancelled = data.reduce((s, r) => s + r.cancelledAmount, 0);
        const totalCount = data.reduce((s, r) => s + r.totalCount, 0);

        const cardSalesTax = Math.round(totalAmount / 11);
        const cardSalesSupply = totalAmount - cardSalesTax;

        document.getElementById('card-sales-summary-cards').innerHTML = [
            createSummaryCard('blue', ICONS.card, '카드매출 합계', formatCurrency(totalAmount), 
                `공급가액: ${formatCurrency(cardSalesSupply)} · 부가세: ${formatCurrency(cardSalesTax)} · ${data.length}일`),
            createSummaryCard('emerald', ICONS.sales, '승인 합계', formatCurrency(totalApproved),
                `${data.reduce((s, r) => s + r.approvedCount, 0)}건`),
            createSummaryCard('rose', ICONS.purchase, '취소 합계', formatCurrency(Math.abs(totalCancelled)),
                `${data.reduce((s, r) => s + r.cancelledCount, 0)}건`),
            createSummaryCard('amber', ICONS.count, '총 거래건수', `${totalCount}건`, '')
        ].join('');

        const tbody = document.getElementById('card-sales-tbody');
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>${r.date}</td>
                <td class="text-right amount">${r.totalAmount.toLocaleString()}</td>
                <td class="text-center">${r.totalCount}</td>
                <td class="text-right amount positive">${r.approvedAmount.toLocaleString()}</td>
                <td class="text-center">${r.approvedCount}</td>
                <td class="text-right amount ${r.cancelledAmount < 0 ? 'negative' : ''}">${r.cancelledAmount.toLocaleString()}</td>
                <td class="text-center">${r.cancelledCount}</td>
            </tr>
        `).join('');

        document.getElementById('card-sales-footer').innerHTML = `
            <span>${data.length}건 조회됨</span>
            <span class="table-footer-total">합계: ${formatFullCurrency(totalAmount)}</span>
        `;
    }

    // ===== 매입 세부 렌더 =====
    function renderPurchasesView(searchTerm = '') {
        const data = getFilteredData(state.purchaseData);
        const filtered = searchTerm
            ? data.filter(r =>
                (r.supplierName && r.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.itemName && r.itemName.toLowerCase().includes(searchTerm.toLowerCase())))
            : data;

        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);
        const totalSupply = filtered.reduce((s, r) => s + r.supplyAmount, 0);
        const totalTax = filtered.reduce((s, r) => s + r.taxAmount, 0);
        const normalCount = filtered.filter(r => r.classification === '세금계산서').length;
        const correctionCount = filtered.filter(r => r.classification === '수정세금계산서').length;

        document.getElementById('purchases-summary-cards').innerHTML = [
            createSummaryCard('rose', ICONS.purchase, '매입 합계금액', formatCurrency(totalAmount), `${filtered.length}건`),
            createSummaryCard('blue', ICONS.profit, '공급가액', formatCurrency(totalSupply), ''),
            createSummaryCard('amber', ICONS.tax, '세액 합계', formatCurrency(totalTax), ''),
            createSummaryCard('purple', ICONS.count, '거래 분류',
                `${normalCount}건`,
                correctionCount > 0 ? `<span class="negative">수정 ${correctionCount}건</span>` : '정상발급')
        ].join('');

        const tbody = document.getElementById('purchases-tbody');
        tbody.innerHTML = filtered.map((r, idx) => `
            <tr data-type="purchases" data-idx="${state.purchaseData.indexOf(r)}">
                <td>${r.date}</td>
                <td>${r.supplierName || '-'}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${r.itemName || '-'}</td>
                <td class="text-right amount ${r.totalAmount < 0 ? 'negative' : ''}">${r.totalAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.supplyAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.taxAmount.toLocaleString()}</td>
                <td><span class="tag ${r.classification === '수정세금계산서' ? 'correction' : 'normal'}">${r.classification === '수정세금계산서' ? '수정' : '일반'}</span></td>
            </tr>
        `).join('');

        document.getElementById('purchases-footer').innerHTML = `
            <span>${filtered.length}건 조회됨</span>
            <span class="table-footer-total">합계: ${formatFullCurrency(totalAmount)}</span>
        `;
    }

    // ===== ExT 재고 관리 렌더 =====
    // ===== ExT 제품 분류 규칙 =====
    function classifyExtProduct(code, name) {
        const c = normalizeExtCode(code).toUpperCase();
        const n = (name || '').toLowerCase();
        
        if (c.includes('EXT1000S') || c.includes('EXT1001S') || n.includes('192reaction') || n.includes('192 rxn') || n.includes('19*2')) {
            if (c.includes('DEMO')) return 'starter_96';
            return 'starter_192';
        }
        if (c.includes('DEMO') || n.includes('starter pack [ea]') || n.includes('96x2reaction')) {
            return 'starter_96';
        }
        if (c.includes('EXT1025K') || c.includes('EXT1025K(할증)') || c.includes('EXT-1025K')) {
            return 'kit_10_25';
        }
        if (c.includes('EXT10025K') || c.includes('EXT10025K(할증)') || c.includes('EXT-10025K')) {
            return 'kit_100_25';
        }
        if (c.includes('EXT1096K') || c.includes('EXT1096K(할증)') || c.includes('EXT-1096K')) {
            return 'kit_10_96';
        }
        if (c.includes('EXT10096K') || c.includes('EXT10096K(할증)') || c.includes('EXT-10096K') || n.includes('100 μl kit')) {
            return 'kit_100_96';
        }
        if (c.includes('EXT50T') || n.includes('tube')) {
            return 'tube';
        }
        if (c.includes('DEMO_VERSION')) {
            return 'starter_96';
        }
        
        // fallback by name
        if (n.includes('192')) return 'starter_192';
        if (n.includes('96') && n.includes('starter')) return 'starter_96';
        if (n.includes('10 ') && n.includes('25')) return 'kit_10_25';
        if (n.includes('100 ') && n.includes('25')) return 'kit_100_25';
        if (n.includes('10 ') && n.includes('96')) return 'kit_10_96';
        if (n.includes('100 ') && n.includes('96')) return 'kit_100_96';
        if (n.includes('tube')) return 'tube';

        return null;
    }

    // ===== 금액 및 수량의 한국어 단위 포맷 =====
    function formatKoreanUnit(val) {
        if (Math.abs(val) >= 100000000) {
            return (val / 100000000).toFixed(1).replace('.0', '') + '억';
        }
        if (Math.abs(val) >= 10000) {
            return (val / 10000).toFixed(1).replace('.0', '') + '만';
        }
        return val.toLocaleString() + '원';
    }

    // ===== 결산 보고서 영업 이익 트렌드 막대 그래프 그리기 =====
    function updateReportTrendChart(canvasId, trendData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (state.charts[canvasId]) {
            state.charts[canvasId].destroy();
        }

        const dCtx = ctx.getContext('2d');
        let gradProfit = dCtx.createLinearGradient(0, 0, 0, 200);
        gradProfit.addColorStop(0, 'rgba(124, 58, 237, 0.85)'); // Indigo/Purple
        gradProfit.addColorStop(1, 'rgba(139, 92, 246, 0.35)');

        // 시계열 흐름(오름차순)으로 보여주기 위해 reverse
        const chartData = [...trendData].reverse();

        const topLabelsPlugin = {
            id: 'topLabels',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#6d28d9';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                chart.data.datasets.forEach((dataset, i) => {
                    chart.getDatasetMeta(i).data.forEach((bar, index) => {
                        const value = dataset.data[index];
                        const formatted = formatKoreanUnit(value);
                        ctx.fillText(formatted, bar.x, bar.y - 6);
                    });
                });
                ctx.restore();
            }
        };

        state.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.label),
                datasets: [{
                    data: chartData.map(d => d.profit),
                    backgroundColor: gradProfit,
                    borderColor: '#7c3aed',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 45
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ' 영업이익: ' + context.raw.toLocaleString() + '원';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        display: false,
                        grace: '15%',
                        grid: {
                            display: false
                        }
                    }
                }
            },
            plugins: [topLabelsPlugin]
        });
    }

    // ===== 월별 판매 추이 선 그래프 그리기 =====
    function updateSalesTrendChart(canvasId, trendData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (state.charts[canvasId]) {
            state.charts[canvasId].destroy();
        }

        const dCtx = ctx.getContext('2d');
        let gradSales = dCtx.createLinearGradient(0, 0, 0, 200);
        gradSales.addColorStop(0, 'rgba(34, 197, 94, 0.4)'); // Green (emerald-500)
        gradSales.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

        const chartData = [...trendData].reverse();

        const topLabelsPluginSales = {
            id: 'topLabelsSales',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#16a34a'; // green-600
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                
                chart.data.datasets.forEach((dataset, i) => {
                    chart.getDatasetMeta(i).data.forEach((point, index) => {
                        const value = dataset.data[index];
                        const formatted = formatKoreanUnit(value);
                        ctx.fillText(formatted, point.x, point.y - 8);
                    });
                });
                ctx.restore();
            }
        };

        state.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.label),
                datasets: [{
                    label: '판매 매출액',
                    data: chartData.map(d => d.sales),
                    borderColor: '#22c55e', // green-500
                    backgroundColor: gradSales,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#16a34a', // green-600
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ' 매출액: ' + context.raw.toLocaleString() + '원';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { size: 11, weight: '500' } }
                    },
                    y: {
                        display: false,
                        grace: '15%',
                        beginAtZero: true,
                        grid: { display: false }
                    }
                }
            },
            plugins: [topLabelsPluginSales]
        });
    }

    // ===== 품목별 판매율 비교 가로 막대 그래프 그리기 =====
    function updateSalesRateChart(canvasId, categories, soldCounts) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (state.charts[canvasId]) {
            state.charts[canvasId].destroy();
        }

        const data = categories.map(c => {
            const soldQty = soldCounts[c.id] || 0;
            const initQty = c.initQty || 0;
            const rate = initQty !== 0 ? parseFloat(((soldQty / initQty) * 100).toFixed(1)) : 0.0;
            return {
                name: c.name,
                code: c.code,
                rate: rate
            };
        });

        // 0% 판매율 품목은 하단으로 배치하고, 판매율이 있는 품목은 내림차순 정렬
        data.sort((a, b) => {
            if (a.rate === 0 && b.rate > 0) return 1;
            if (a.rate > 0 && b.rate === 0) return -1;
            return b.rate - a.rate;
        });

        // 전체 판매율을 계산하여 최상단에 배치
        const totalInitQty = categories.reduce((s, c) => s + c.initQty, 0);
        const totalSoldQty = categories.reduce((s, c) => s + (soldCounts[c.id] || 0), 0);
        const overallRate = totalInitQty !== 0 ? parseFloat(((totalSoldQty / totalInitQty) * 100).toFixed(1)) : 0.0;
        
        data.unshift({
            name: '전체 품목 평균 판매율',
            code: '전체 평균 판매율',
            rate: overallRate,
            isTotal: true
        });

        const dCtx = ctx.getContext('2d');
        let grad = dCtx.createLinearGradient(0, 0, 400, 0);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.25)'); // Indigo light
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.85)'); // Indigo dark

        const topLabelsPlugin = {
            id: 'topLabelsHorizontal',
            beforeTooltipDraw(chart, args) {
                const tooltip = args.tooltip;
                if (tooltip && tooltip.active && tooltip.dataPoints && tooltip.dataPoints.length) {
                    const activeEl = tooltip.dataPoints[0];
                    const meta = chart.getDatasetMeta(activeEl.datasetIndex);
                    const element = meta.data[activeEl.dataIndex];
                    if (element) {
                        tooltip.x = element.x;
                        tooltip.y = element.y;
                        tooltip.caretX = element.x;
                        tooltip.caretY = element.y;
                    }
                }
            },
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                
                chart.data.datasets.forEach((dataset, i) => {
                    chart.getDatasetMeta(i).data.forEach((bar, index) => {
                        const value = dataset.data[index];
                        const item = data[index];
                        
                        // x축 스케일 픽셀값 계산 (막대 바 끝단 좌표)
                        const xPos = chart.scales.x.getPixelForValue(value);
                        const yPos = bar.y;
                        
                        ctx.fillStyle = item && item.isTotal ? '#10b981' : '#4f46e5';
                        ctx.font = 'bold 18px sans-serif'; // 글씨 크기를 2배 확대 (18px)
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(value.toFixed(1) + '%', xPos + 8, yPos);
                    });
                });
                ctx.restore();
            }
        };

        state.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.isTotal ? `${d.code}` : `${d.code} (${d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name})`),
                datasets: [{
                    data: data.map(d => d.rate),
                    backgroundColor: data.map(d => d.isTotal ? 'rgba(16, 185, 129, 0.85)' : grad),
                    borderColor: data.map(d => d.isTotal ? '#10b981' : '#6366f1'),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 14,
                    minBarLength: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        right: 120
                    }
                },
                onClick: (event, elements, chart) => {
                    const scale = chart.scales.y;
                    if (scale && chart.chartArea) {
                        const x = event.x;
                        const y = event.y;
                        
                        // 클릭 좌표가 차트 영역(y축 라벨부터 우측 끝까지) 가로/세로 범위 내인 경우 해당 로우 데이터 처리
                        if (x >= 0 && x <= chart.chartArea.right && y >= chart.chartArea.top && y <= chart.chartArea.bottom) {
                            const index = scale.getValueForPixel(y);
                            const roundedIndex = Math.round(index);
                            if (roundedIndex >= 0 && roundedIndex < data.length) {
                                const item = data[roundedIndex];
                                showLargeLabelPopup(item.code, item.name, item.rate);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        position: 'average',
                        xAlign: 'left',
                        yAlign: 'center',
                        backgroundColor: 'rgba(59, 130, 246, 0.95)',
                        titleFont: { size: 11, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 8,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ' 판매율: ' + context.raw.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#6b7280',
                            font: { size: 10 },
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#1e1b16',
                            font: { size: 10, weight: '500' }
                        }
                    }
                }
            },
            plugins: [topLabelsPlugin]
        });
    }

    // ===== ExT 결산 트랜드 데이터 수집 =====
    function getExtTrendData() {
        const periods = new Set();
        state.extSalesData.forEach(r => {
            if (!r.dateNo) return;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (m) {
                const year = m[1];
                const month = m[2];
                if (state.currentPeriod !== 'quarterly') {
                    periods.add(`${year}-${month}`);
                } else {
                    const q = Math.ceil(parseInt(month, 10) / 3);
                    periods.add(`${year}-Q${q}`);
                }
            }
        });

        const sortedPeriods = Array.from(periods).sort();

        const trend = sortedPeriods.map(pStr => {
            let filteredSales = [];
            let label = '';
            let fullLabel = '';
            
            if (state.currentPeriod !== 'quarterly') {
                const [year, month] = pStr.split('-');
                filteredSales = state.extSalesData.filter(r => {
                    const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
                    return m && m[1] === year && m[2] === month;
                });
                label = `${parseInt(month, 10)}월`;
                fullLabel = `${year}년 ${parseInt(month, 10)}월`;
            } else {
                const [year, qNum] = pStr.split('-Q');
                const q = parseInt(qNum, 10);
                filteredSales = state.extSalesData.filter(r => {
                    const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
                    if (!m) return false;
                    const rQ = Math.ceil(parseInt(m[2], 10) / 3);
                    return m[1] === year && rQ === q;
                });
                label = `${qNum}분기`;
                fullLabel = `${year}년 ${qNum}분기`;
            }

            const totalSales = filteredSales.reduce((s, r) => s + r.totalAmount, 0);
            const totalCost = filteredSales.reduce((s, r) => {
                if (r.buyer === '주식회사 다윈바이오텍' && r.totalAmount === 42515000) {
                    return s + 30800000; // (850만*3 + 125만*2) * 1.1 = 3,080만원
                }
                const catId = classifyExtProduct(r.code, r.name);
                const cat = EXT_CATEGORIES.find(c => c.id === catId);
                const cost = cat ? cat.unitPrice * 1.1 : 0;
                return s + (r.qty * cost);
            }, 0);

            return {
                label,
                fullLabel,
                sales: totalSales,
                cost: totalCost,
                profit: totalSales - totalCost,
                margin: totalSales !== 0 ? (((totalSales - totalCost) / totalSales) * 100).toFixed(1) : '0.0'
            };
        });

        return trend.filter(d => d.sales !== 0 || d.cost !== 0).reverse();
    }

    // ===== NuGen 결산 트랜드 데이터 수집 =====
    function getNujenTrendData() {
        const periods = new Set();
        state.nujenSalesData.forEach(r => {
            if (!r.dateNo) return;
            const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
            if (m) {
                const year = m[1];
                const month = m[2];
                if (state.currentPeriod !== 'quarterly') {
                    periods.add(`${year}-${month}`);
                } else {
                    const q = Math.ceil(parseInt(month, 10) / 3);
                    periods.add(`${year}-Q${q}`);
                }
            }
        });

        const sortedPeriods = Array.from(periods).sort();

        const trend = sortedPeriods.map(pStr => {
            let filteredSales = [];
            let label = '';
            let fullLabel = '';
            
            if (state.currentPeriod !== 'quarterly') {
                const [year, month] = pStr.split('-');
                filteredSales = state.nujenSalesData.filter(r => {
                    const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
                    return m && m[1] === year && m[2] === month;
                });
                label = `${parseInt(month, 10)}월`;
                fullLabel = `${year}년 ${parseInt(month, 10)}월`;
            } else {
                const [year, qNum] = pStr.split('-Q');
                const q = parseInt(qNum, 10);
                filteredSales = state.nujenSalesData.filter(r => {
                    const m = r.dateNo.match(/^(\d{4})[/-](\d{2})/);
                    if (!m) return false;
                    const rQ = Math.ceil(parseInt(m[2], 10) / 3);
                    return m[1] === year && rQ === q;
                });
                label = `${qNum}분기`;
                fullLabel = `${year}년 ${qNum}분기`;
            }

            const totalSales = filteredSales.reduce((s, r) => s + r.totalAmount, 0);
            const totalCost = filteredSales.reduce((s, r) => {
                if (r.buyer === '(주)베르티스' && r.totalAmount === 836000 && r.qty === 4) {
                    return s + 550000; // (12,500 * 10 * 4) * 1.1 = 550,000원
                }
                const catId = classifyNujenProduct(r.code, r.name);
                const cat = NUJEN_CATEGORIES.find(c => c.id === catId);
                const cost = cat ? cat.unitPrice * 1.1 : 0;
                return s + (r.qty * cost);
            }, 0);

            return {
                label,
                fullLabel,
                sales: totalSales,
                cost: totalCost,
                profit: totalSales - totalCost,
                margin: totalSales !== 0 ? (((totalSales - totalCost) / totalSales) * 100).toFixed(1) : '0.0'
            };
        });

        return trend.filter(d => d.sales !== 0 || d.cost !== 0).reverse();
    }

    function renderInventoryView() {
        const categories = [
            { id: 'starter_192', code: 'EXT1000S', name: 'ExT Starter Pack (192 rxn)', spec: '192 reactions [set]', initQty: 0, initAmount: 0, unitPrice: 8500000 },
            { id: 'starter_96', code: 'EXT1000S(Demo)', name: 'ExT Starter Pack (96 rxn)', spec: '96 reactions [set]', initQty: 0, initAmount: 0, unitPrice: 7225000 },
            { id: 'kit_10_25', code: 'EXT1025K', name: 'ExT 10 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 420000 },
            { id: 'kit_100_25', code: 'EXT10025K', name: 'ExT 100 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 420000 },
            { id: 'kit_10_96', code: 'EXT1096K', name: 'ExT 10 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 1250000 },
            { id: 'kit_100_96', code: 'EXT10096K', name: 'ExT 100 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 0, initAmount: 0, unitPrice: 1250000 },
            { id: 'tube', code: 'EXT50T', name: 'ExTransfection Tube', spec: 'EXT50T', initQty: 0, initAmount: 0, unitPrice: 280000 }
        ];

        // 1. 기초 매입(구매현황) 데이터 실시간 집계 (부가세 포함)
        state.extPurchaseData.forEach(p => {
            const catId = classifyExtProduct(p.code, p.name);
            const cat = categories.find(c => c.id === catId);
            if (cat) {
                cat.initQty += p.qty;
                cat.initAmount += p.totalAmount;
            }
        });

        // 2. 당기 매출 및 판매량 집계 (부가세 포함)
        const soldCounts = {};
        const soldAmounts = {};
        const accumulatedSoldCounts = {};
        categories.forEach(c => {
            soldCounts[c.id] = 0;
            soldAmounts[c.id] = 0;
            accumulatedSoldCounts[c.id] = 0;
        });

        getFilteredExtSalesData().forEach(s => {
            const catId = classifyExtProduct(s.code, s.name);
            if (catId) {
                soldCounts[catId] += s.qty;
                soldAmounts[catId] += s.totalAmount;
            }
        });

        // 2-1. 누적 매출 집계 (기말 재고 차감용)
        getAccumulatedExtSalesData().forEach(s => {
            const catId = classifyExtProduct(s.code, s.name);
            if (catId) {
                accumulatedSoldCounts[catId] += s.qty;
            }
        });

        const totalInitQty = categories.reduce((s, c) => s + c.initQty, 0);
        const totalInitAmount = categories.reduce((s, c) => s + c.initAmount, 0);
        const totalSoldQty = Object.values(soldCounts).reduce((s, v) => s + v, 0);
        const totalSoldAmount = Object.values(soldAmounts).reduce((s, v) => s + v, 0);
        
        // 기말 재고 수량 = 기초 입고 수량 - 누적 매출 수량
        const totalAccumulatedSoldQty = Object.values(accumulatedSoldCounts).reduce((s, v) => s + v, 0);
        const totalStockQty = Math.max(totalInitQty - totalAccumulatedSoldQty, 0);
        
        // 기말 재고 금액
        const totalStockAmount = categories.reduce((s, c) => {
            const accSold = accumulatedSoldCounts[c.id] || 0;
            const stock = Math.max(c.initQty - accSold, 0);
            return s + (stock * c.unitPrice * 1.1);
        }, 0);

        const initTax = Math.round(totalInitAmount / 11);
        const initSupply = totalInitAmount - initTax;
        const soldTax = Math.round(totalSoldAmount / 11);
        const soldSupply = totalSoldAmount - soldTax;
        const stockTax = Math.round(totalStockAmount / 11);
        const stockSupply = totalStockAmount - stockTax;

        const extSalesRate = totalInitQty !== 0 ? ((totalSoldQty / totalInitQty) * 100).toFixed(1) : '0.0';

        // 상단 재고 현황 카드 렌더
        document.getElementById('inventory-summary-cards').innerHTML = [
            createSummaryCard('indigo', ICONS.purchase, '기초 입고 현황', formatCurrency(totalInitAmount), `공급가액: ${formatCurrency(initSupply)} · 세액: ${formatCurrency(initTax)} · 수량: ${totalInitQty}개`),
            createSummaryCard('blue', ICONS.sales, '당기 매출 현황', formatCurrency(totalSoldAmount), `공급가액: ${formatCurrency(soldSupply)} · 세액: ${formatCurrency(soldTax)} · 수량: ${totalSoldQty}개 (판매율: ${extSalesRate}%)`),
            createSummaryCard('emerald', ICONS.profit, '현재 재고 현황', formatCurrency(totalStockAmount), `공급가액: ${formatCurrency(stockSupply)} · 세액: ${formatCurrency(stockTax)} · 수량: ${totalStockQty}개`)
        ].join('');

        // 3. ExT 결산 보고서 동적 집계 (트랜드 뷰)
        const reportTbody = document.getElementById('ext-report-tbody');
        const trendData = getExtTrendData();

        const totalSales = trendData.reduce((s, d) => s + d.sales, 0);
        const totalCost = trendData.reduce((s, d) => s + d.cost, 0);
        const totalProfit = totalSales - totalCost;
        const totalMargin = totalSales !== 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
        const totalProfitCls = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
        const totalRatioCls = parseFloat(totalMargin) >= 0 ? 'ratio-positive' : 'ratio-negative';

        let extRows = trendData.map(d => `
            <tr>
                <td style="font-weight: 700;">${d.fullLabel}</td>
                <td class="text-right">${d.sales.toLocaleString()}원</td>
                <td class="text-right">${d.cost.toLocaleString()}원</td>
                <td class="text-right" style="color: var(--accent-indigo); font-weight: 700;">${d.profit.toLocaleString()}원</td>
                <td class="text-right" style="color: var(--accent-indigo); font-weight: 700;">${d.margin}%</td>
            </tr>
        `).join('');

        extRows += `
            <tr class="total-row">
                <td>전체 합계</td>
                <td class="text-right">${totalSales.toLocaleString()}원</td>
                <td class="text-right">${totalCost.toLocaleString()}원</td>
                <td class="text-right ${totalProfitCls}">${totalProfit.toLocaleString()}원</td>
                <td class="text-right ${totalRatioCls}">${totalMargin}%</td>
            </tr>
        `;

        reportTbody.innerHTML = extRows;

        // 차트 헤더 정보 동적 조절 (ExT)
        const extChartHeader = document.getElementById('ext-report-header');
        if (extChartHeader) {
            extChartHeader.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:1.15rem; font-weight:800; color:var(--text-primary);">영업 이익 (Profit) 트렌드</span>
                    <span style="font-size:0.75rem; font-weight:400; color:var(--text-secondary);">2026년 ${state.currentPeriod === 'quarterly' ? '분기별' : '월별'} 영업 이익(매출 - 매입) 현황입니다.</span>
                </div>
            `;
        }

        // 차트 업데이트
        updateSalesTrendChart('ext-sales-trend-chart', trendData);
        updateReportTrendChart('ext-report-chart', trendData);

        // 4. ExT 제품 재고 및 금액 현황 테이블 렌더
        const tbody = document.getElementById('inventory-tbody');
        tbody.innerHTML = categories.map(c => {
            const soldQty = soldCounts[c.id] || 0;
            const soldAmt = soldAmounts[c.id] || 0;
            const accSoldQty = accumulatedSoldCounts[c.id] || 0;
            const stockQty = Math.max(c.initQty - accSoldQty, 0);
            const stockAmt = stockQty * c.unitPrice * 1.1;
            
            let statusHTML = '';
            if (stockQty <= 0) {
                statusHTML = '<span class="tag correction">품절</span>';
            } else if (stockQty <= 5) {
                statusHTML = '<span class="tag correction" style="background:rgba(245,158,11,0.1);color:var(--accent-amber);">재고 부족</span>';
            } else {
                statusHTML = '<span class="tag normal" style="background:rgba(16,185,129,0.1);color:var(--accent-emerald);">보유중</span>';
            }

            return `
                <tr>
                    <td style="font-weight:700;">${c.name}</td>
                    <td style="font-family:monospace;font-size:0.82rem;color:var(--text-secondary);">${c.code}</td>
                    <td style="font-size:0.82rem;color:var(--text-secondary);">${c.spec}</td>
                    <td class="text-center" style="font-weight:600;">${c.initQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;">${c.initAmount.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:600;color:var(--accent-indigo);">${soldQty}개<br><span style="font-size:0.75rem;color:var(--text-tertiary);">(${c.initQty !== 0 ? ((soldQty / c.initQty) * 100).toFixed(1) : '0.0'}%)</span></td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;color:var(--accent-indigo);">${soldAmt.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:700;color:${stockQty <= 5 ? 'var(--accent-rose)' : 'var(--text-primary)'}">${stockQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;font-weight:600;">${stockAmt.toLocaleString()}원</td>
                    <td class="text-center">${statusHTML}</td>
                </tr>
            `;
        }).join('');

        renderExtSalesList();
    }

    function renderNujenView() {
        const categories = [
            { id: 'ngs_sep_10', code: 'NGS-SEP-10', name: 'NuGen Serological pipette, Stretching, 10ml', spec: '200 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 30000 },
            { id: 'ngs_sep_100', code: 'NGS-SEP-100', name: 'NuGen Serological pipette, Welding, 100ml', spec: '40 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 59500 },
            { id: 'ngs_sep_50', code: 'NGS-SEP-50', name: 'NuGen Serological pipette, Welding, 50ml', spec: '75 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 49000 },
            { id: 'ngs_sep_25', code: 'NGS-SEP-25', name: 'NuGen Serological pipette, Welding, 25ml', spec: '100 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 28000 },
            { id: 'ngs_sep_5', code: 'NGS-SEP-5', name: 'NuGen Serological pipette, Stretching, 5ml', spec: '200 PCS/BOX, 6 BOXES/CASE', initQty: 0, initAmount: 0, unitPrice: 30000 },
            { id: 'ng_stag_1250_rts_er', code: 'NG-STAG-1250-RTS-ER', name: 'NuGen AG Tip, Empty rack, 1250ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2500 },
            { id: 'ng_stag_200_trs_er', code: 'NG-STAG-200-TRS-ER', name: 'NuGen AG Tip, Empty rack, 200ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2000 },
            { id: 'ng_stag_10_rts_er', code: 'NG-STAG-10-RTS-ER', name: 'NuGen AG Tip, Empty rack, 10ul', spec: '10 racks/Pack, 5 Packs/Case', initQty: 0, initAmount: 0, unitPrice: 2000 },
            { id: 'ng_stag_1250_rs', code: 'NG-STAG-1250-RS', name: 'NuGen AG Tip, 1250ul, Nature, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 3200 },
            { id: 'ng_stag_200_rs', code: 'NG-STAG-200-RS', name: 'NuGen AG Tip, 200ul, Yellow, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
            { id: 'ng_stag_10l_rs', code: 'NG-STAG-10L-RS', name: 'NuGen AG Tip, 10ul, Extra Long, Nature', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
            { id: 'ng_stag_10_rs', code: 'NG-STAG-10-RS', name: 'NuGen AG Tip, 10ul, Nature, Racked', spec: '96 Tips/rack, 10 racks/Pack, 5 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 2800 },
            { id: 'ng_stag_1250_rts', code: 'NG-STAG-1250-RTS', name: 'NuGen AG Refill Tip, 1250ul, Nature', spec: '480 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 12500 },
            { id: 'ng_stag_200_rts', code: 'NG-STAG-200-RTS', name: 'NuGen AG Refill Tip, 200ul, Yellow', spec: '960 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 16000 },
            { id: 'ng_stag_10_rts', code: 'NG-STAG-10-RTS', name: 'NuGen AG Refill Tip, 10ul, Nature', spec: '960 Tips/Pack, 10 Packs/Carton', initQty: 0, initAmount: 0, unitPrice: 16000 },
            { id: 'ng_ct_3050_s', code: 'NG-CT-3050-S', name: 'NuGen 50ml Centrifuge Tube, Sterile', spec: '25 PCS/Bag, 500PCS/Box', initQty: 0, initAmount: 0, unitPrice: 60000 },
            { id: 'ng_ct_3015_s', code: 'NG-CT-3015-S', name: 'NuGen 15ml Centrifuge Tube, Sterile', spec: '25 PCS/Bag, 500PCS/Box', initQty: 0, initAmount: 0, unitPrice: 44800 }
        ];

        // 1. 기초 매입 데이터 실시간 집계 (부가세 포함)
        state.nujenPurchaseData.forEach(p => {
            const catId = classifyNujenProduct(p.code, p.name);
            const cat = categories.find(c => c.id === catId);
            if (cat) {
                cat.initQty += p.qty;
                cat.initAmount += p.totalAmount;
            }
        });

        // 2. 당기 매출 및 판매량 집계 (부가세 포함)
        const soldCounts = {};
        const soldAmounts = {};
        const accumulatedSoldCounts = {};
        categories.forEach(c => {
            soldCounts[c.id] = 0;
            soldAmounts[c.id] = 0;
            accumulatedSoldCounts[c.id] = 0;
        });

        getFilteredNujenSalesData().forEach(s => {
            const catId = classifyNujenProduct(s.code, s.name);
            if (catId) {
                soldCounts[catId] += s.qty;
                soldAmounts[catId] += s.totalAmount;
            }
        });

        // 2-1. 누적 매출 집계 (기말 재고 차감용)
        getAccumulatedNujenSalesData().forEach(s => {
            const catId = classifyNujenProduct(s.code, s.name);
            if (catId) {
                accumulatedSoldCounts[catId] += s.qty;
            }
        });

        const totalInitQty = categories.reduce((s, c) => s + c.initQty, 0);
        const totalInitAmount = categories.reduce((s, c) => s + c.initAmount, 0);
        const totalSoldQty = Object.values(soldCounts).reduce((s, v) => s + v, 0);
        const totalSoldAmount = Object.values(soldAmounts).reduce((s, v) => s + v, 0);
        
        // 기말 재고 수량
        const totalAccumulatedSoldQty = Object.values(accumulatedSoldCounts).reduce((s, v) => s + v, 0);
        const totalStockQty = Math.max(totalInitQty - totalAccumulatedSoldQty, 0);
        
        // 기말 재고 금액 (원가)
        const totalStockAmount = categories.reduce((s, c) => {
            const accSold = accumulatedSoldCounts[c.id] || 0;
            const stock = Math.max(c.initQty - accSold, 0);
            return s + (stock * c.unitPrice * 1.1);
        }, 0);

        const initTax = Math.round(totalInitAmount / 11);
        const initSupply = totalInitAmount - initTax;
        const soldTax = Math.round(totalSoldAmount / 11);
        const soldSupply = totalSoldAmount - soldTax;
        const stockTax = Math.round(totalStockAmount / 11);
        const stockSupply = totalStockAmount - stockTax;

        const nujenSalesRate = totalInitQty !== 0 ? ((totalSoldQty / totalInitQty) * 100).toFixed(1) : '0.0';

        // 상단 재고 현황 카드 렌더
        document.getElementById('nujen-summary-cards').innerHTML = [
            createSummaryCard('indigo', ICONS.purchase, '기초 입고 현황', formatCurrency(totalInitAmount), `공급가액: ${formatCurrency(initSupply)} · 세액: ${formatCurrency(initTax)} · 수량: ${totalInitQty}개`),
            createSummaryCard('blue', ICONS.sales, '당기 매출 현황', formatCurrency(totalSoldAmount), `공급가액: ${formatCurrency(soldSupply)} · 세액: ${formatCurrency(soldTax)} · 수량: ${totalSoldQty}개 (판매율: ${nujenSalesRate}%)`),
            createSummaryCard('emerald', ICONS.profit, '현재 재고 현황', formatCurrency(totalStockAmount), `공급가액: ${formatCurrency(stockSupply)} · 세액: ${formatCurrency(stockTax)} · 수량: ${totalStockQty}개`)
        ].join('');

        // 3. NuGen 결산 보고서 동적 집계 (트랜드 뷰)
        const reportTbody = document.getElementById('nujen-report-tbody');
        const trendData = getNujenTrendData();

        const totalSales = trendData.reduce((s, d) => s + d.sales, 0);
        const totalCost = trendData.reduce((s, d) => s + d.cost, 0);
        const totalProfit = totalSales - totalCost;
        const totalMargin = totalSales !== 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
        const totalProfitCls = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';
        const totalRatioCls = parseFloat(totalMargin) >= 0 ? 'ratio-positive' : 'ratio-negative';

        let nujenRows = trendData.map(d => `
            <tr>
                <td style="font-weight: 700;">${d.fullLabel}</td>
                <td class="text-right">${d.sales.toLocaleString()}원</td>
                <td class="text-right">${d.cost.toLocaleString()}원</td>
                <td class="text-right" style="color: var(--accent-indigo); font-weight: 700;">${d.profit.toLocaleString()}원</td>
                <td class="text-right" style="color: var(--accent-indigo); font-weight: 700;">${d.margin}%</td>
            </tr>
        `).join('');

        nujenRows += `
            <tr class="total-row">
                <td>전체 합계</td>
                <td class="text-right">${totalSales.toLocaleString()}원</td>
                <td class="text-right">${totalCost.toLocaleString()}원</td>
                <td class="text-right ${totalProfitCls}">${totalProfit.toLocaleString()}원</td>
                <td class="text-right ${totalRatioCls}">${totalMargin}%</td>
            </tr>
        `;

        reportTbody.innerHTML = nujenRows;

        // 차트 헤더 정보 동적 조절 (NuGen)
        const nujenChartHeader = document.getElementById('nujen-report-header');
        if (nujenChartHeader) {
            nujenChartHeader.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:1.15rem; font-weight:800; color:var(--text-primary);">영업 이익 (Profit) 트렌드</span>
                    <span style="font-size:0.75rem; font-weight:400; color:var(--text-secondary);">2026년 ${state.currentPeriod === 'quarterly' ? '분기별' : '월별'} 영업 이익(매출 - 매입) 현황입니다.</span>
                </div>
            `;
        }

        // 차트 업데이트
        updateSalesTrendChart('nujen-sales-trend-chart', trendData);
        updateReportTrendChart('nujen-report-chart', trendData);

        // 4. NuGen 제품 재고 및 금액 현황 테이블 렌더
        const tbody = document.getElementById('nujen-tbody');
        tbody.innerHTML = categories.map(c => {
            const soldQty = soldCounts[c.id] || 0;
            const soldAmt = soldAmounts[c.id] || 0;
            const accSoldQty = accumulatedSoldCounts[c.id] || 0;
            const stockQty = Math.max(c.initQty - accSoldQty, 0);
            const stockAmt = stockQty * c.unitPrice * 1.1;
            
            let statusHTML = '';
            if (stockQty <= 0) {
                statusHTML = '<span class="tag correction">품절</span>';
            } else if (stockQty <= 5) {
                statusHTML = '<span class="tag correction" style="background:rgba(245,158,11,0.1);color:var(--accent-amber);">재고 부족</span>';
            } else {
                statusHTML = '<span class="tag normal" style="background:rgba(16,185,129,0.1);color:var(--accent-emerald);">보유중</span>';
            }

            return `
                <tr>
                    <td style="font-weight:700;">${c.name}</td>
                    <td style="font-family:monospace;font-size:0.82rem;color:var(--text-secondary);">${c.code}</td>
                    <td style="font-size:0.82rem;color:var(--text-secondary);">${c.spec}</td>
                    <td class="text-center" style="font-weight:600;">${c.initQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;">${c.initAmount.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:600;color:var(--accent-indigo);">${soldQty}개<br><span style="font-size:0.75rem;color:var(--text-tertiary);">(${c.initQty !== 0 ? ((soldQty / c.initQty) * 100).toFixed(1) : '0.0'}%)</span></td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;color:var(--accent-indigo);">${soldAmt.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:700;color:${stockQty <= 5 ? 'var(--accent-rose)' : 'var(--text-primary)'}">${stockQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;font-weight:600;">${stockAmt.toLocaleString()}원</td>
                    <td class="text-center">${statusHTML}</td>
                </tr>
            `;
        }).join('');

        renderNujenSalesList();
    }

    // ===== 뷰 전환 =====
    function switchView(viewName) {
        if (viewName === 'vat' && !state.isVatAuthorized) {
            const modal = document.getElementById('password-modal');
            const input = document.getElementById('vat-password-input');
            const errorMsg = document.getElementById('password-error');
            if (modal && input) {
                input.value = '';
                if (errorMsg) errorMsg.style.display = 'none';
                modal.classList.add('active');
                input.focus();
            }
            return;
        }

        state.currentView = viewName;

        // 네비게이션 활성화
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navEl = document.getElementById(`nav-${viewName}`);
        if (navEl) navEl.classList.add('active');

        // 뷰 전환
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        const viewEl = document.getElementById(`view-${viewName}`);
        if (viewEl) viewEl.classList.add('active');

        // 타이틀 업데이트
        const titles = {
            'dashboard': ['종합 현황', '매출, 카드매출, 매입 종합 현황을 확인합니다.'],
            'sales': ['매출 내역', '세금계산서 기반 매출 세부내역을 확인합니다.'],
            'inventory': ['ExT 재고관리', 'ExTransfection 제품군별 기초 입고 및 판매 대비 재고 현황입니다.'],
            'nujen': ['뉴진스 재고관리', 'NuGen 제품군별 기초 입고 및 판매 대비 재고 현황입니다.'],
            'card-sales': ['카드매출 내역', '카드매출전표 세부내역을 확인합니다.'],
            'purchases': ['매입 내역', '세금계산서 기반 매입 세부내역을 확인합니다.'],
            'vat': ['부가세 신고', '2026년 상반기 부가가치세 신고를 위한 세금계산서 및 신용카드 매입 집계 현황입니다.']
        };
        const [title, desc] = titles[viewName] || ['', ''];
        document.getElementById('page-title').textContent = title;
        document.getElementById('page-desc').textContent = desc;

        renderCurrentView();

        // 모바일: 사이드바 닫기
        document.getElementById('sidebar').classList.remove('open');
    }

    function renderCurrentView() {
        switch (state.currentView) {
            case 'dashboard': renderDashboard(); break;
            case 'sales': renderSalesView(); break;
            case 'inventory': renderInventoryView(); break;
            case 'nujen': renderNujenView(); break;
            case 'card-sales': renderCardSalesView(); break;
            case 'purchases': renderPurchasesView(); break;
            case 'vat': renderVatView(); break;
        }
    }

    // ===== 기간 선택 =====
    function switchPeriod(period) {
        state.currentPeriod = period;

        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        const subSelector = document.getElementById('sub-period-selector');
        const subSelect = document.getElementById('sub-period-select');

        if (period === 'all') {
            subSelector.style.display = 'none';
            state.selectedSubPeriod = null;
        } else {
            subSelector.style.display = 'block';
            const periods = getAvailablePeriods(period);
            subSelect.innerHTML = periods.map(p => {
                const label = period === 'monthly' ? getMonthLabel(p) : getQuarterLabel(p);
                return `<option value="${p}">${label}</option>`;
            }).join('');
            state.selectedSubPeriod = periods[0] || null;
        }

        renderCurrentView();
    }

    // ===== 모달 (세부 상세) =====
    function showDetailModal(type, idx) {
        const modal = document.getElementById('detail-modal');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        let html = '';

        if (type === 'nujen-sales') {
            const r = state.nujenSalesData[idx];
            if (!r) return;
            title.textContent = '뉴진스 매출 상세';
            html = buildDetailHTML([
                ['일자/번호', r.dateNo],
                ['거래처', r.buyer],
                ['품목코드', r.code || '-'],
                ['품목명', r.name || '-'],
                ['수량', (r.qty || 0).toLocaleString() + '개'],
                ['단가', formatFullCurrency(r.unitPrice)],
                ['공급가액', formatFullCurrency(r.supplyAmount)],
                ['세액', formatFullCurrency(r.taxAmount)],
                ['합계금액', { value: formatFullCurrency(r.totalAmount), highlight: true }]
            ]);
        } else if (type === 'ext-sales') {
            const r = state.extSalesData[idx];
            if (!r) return;
            title.textContent = 'ExT 매출 상세';
            html = buildDetailHTML([
                ['일자/번호', r.dateNo],
                ['거래처', r.buyer],
                ['수금일자', r.collectionDate || '-'],
                ['품목코드', r.code || '-'],
                ['품목명', r.name || '-'],
                ['수량', (r.qty || 0).toLocaleString() + '개'],
                ['단가', formatFullCurrency(r.unitPrice)],
                ['공급가액', formatFullCurrency(r.supplyAmount)],
                ['세액', formatFullCurrency(r.taxAmount)],
                ['합계금액', { value: formatFullCurrency(r.totalAmount), highlight: true }]
            ]);
        } else if (type === 'sales') {
            const r = state.salesData[idx];
            if (!r) return;
            title.textContent = '매출 거래 상세';
            html = buildDetailHTML([
                ['작성일자', r.date],
                ['승인번호', r.approvalNo],
                ['발급일자', r.issueDate],
                ['거래처(공급받는자)', r.buyerName],
                ['대표자', r.buyerCeo],
                ['사업자등록번호', r.buyerBizNo],
                ['주소', r.buyerAddr],
                ['합계금액', { value: formatFullCurrency(r.totalAmount), highlight: true }],
                ['공급가액', formatFullCurrency(r.supplyAmount)],
                ['세액', formatFullCurrency(r.taxAmount)],
                ['분류', r.classification],
                ['종류', r.type],
                ['발급유형', r.issueType],
                ['비고', r.note || '-'],
                ['품목명', r.itemName || '-'],
                ['품목규격', r.itemSpec || '-'],
                ['품목수량', r.itemQty || '-'],
                ['품목단가', r.itemUnitPrice || '-'],
            ]);
        } else if (type === 'purchases') {
            const r = state.purchaseData[idx];
            if (!r) return;
            title.textContent = '매입 거래 상세';
            html = buildDetailHTML([
                ['작성일자', r.date],
                ['승인번호', r.approvalNo],
                ['발급일자', r.issueDate],
                ['거래처(공급자)', r.supplierName],
                ['대표자', r.supplierCeo],
                ['사업자등록번호', r.supplierBizNo],
                ['주소', r.supplierAddr],
                ['합계금액', { value: formatFullCurrency(r.totalAmount), highlight: true }],
                ['공급가액', formatFullCurrency(r.supplyAmount)],
                ['세액', formatFullCurrency(r.taxAmount)],
                ['분류', r.classification],
                ['종류', r.type],
                ['발급유형', r.issueType],
                ['비고', r.note || '-'],
                ['품목명', r.itemName || '-'],
                ['품목규격', r.itemSpec || '-'],
                ['품목수량', r.itemQty || '-'],
                ['품목단가', r.itemUnitPrice || '-'],
            ]);
        }

        body.innerHTML = html;
        modal.classList.add('active');
    }

    function buildDetailHTML(rows) {
        return rows.map(([label, value]) => {
            const isObj = typeof value === 'object' && value !== null;
            const displayValue = isObj ? value.value : (value || '-');
            const cssClass = isObj && value.highlight ? ' highlight' : '';
            return `
                <div class="modal-detail-row">
                    <span class="modal-detail-label">${label}</span>
                    <span class="modal-detail-value${cssClass}">${displayValue}</span>
                </div>
            `;
        }).join('');
    }

    // ===== 이벤트 바인딩 =====
    function bindEvents() {
        // 네비게이션
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) switchView(view);
            });
        });

        // 기간 선택
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchPeriod(btn.dataset.period);
            });
        });

        // 하위 기간 선택
        document.getElementById('sub-period-select').addEventListener('change', e => {
            state.selectedSubPeriod = e.target.value;
            renderCurrentView();
        });

        // 사이드바 토글
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // 검색
        document.getElementById('sales-search').addEventListener('input', e => {
            renderSalesView(e.target.value);
        });
        document.getElementById('purchases-search').addEventListener('input', e => {
            renderPurchasesView(e.target.value);
        });
        document.getElementById('ext-sales-search').addEventListener('input', e => {
            renderExtSalesList(e.target.value);
        });
        document.getElementById('nujen-sales-search').addEventListener('input', e => {
            renderNujenSalesList(e.target.value);
        });

        // 테이블 클릭 → 상세 모달
        document.addEventListener('click', e => {
            const row = e.target.closest('tr[data-type]');
            if (row) {
                showDetailModal(row.dataset.type, parseInt(row.dataset.idx));
            }
        });

        // 모달 닫기
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('detail-modal').classList.remove('active');
        });
        document.getElementById('detail-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) {
                document.getElementById('detail-modal').classList.remove('active');
            }
        });

        // 패스워드 모달 이벤트
        const pwdModal = document.getElementById('password-modal');
        if (pwdModal) {
            document.getElementById('password-modal-close').addEventListener('click', () => {
                pwdModal.classList.remove('active');
            });
            pwdModal.addEventListener('click', e => {
                if (e.target === e.currentTarget) {
                    pwdModal.classList.remove('active');
                }
            });
            document.getElementById('password-form').addEventListener('submit', e => {
                e.preventDefault();
                const pwInput = document.getElementById('vat-password-input');
                const errorMsg = document.getElementById('password-error');
                if (pwInput.value === '0610') {
                    pwdModal.classList.remove('active');
                    state.isVatAuthorized = true;
                    sessionStorage.setItem('vat_authorized', 'true');
                    switchView('vat');
                } else {
                    errorMsg.style.display = 'block';
                    pwInput.value = '';
                    pwInput.focus();
                }
            });
        }

        // ESC로 모달 닫기
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.getElementById('detail-modal').classList.remove('active');
                if (pwdModal) pwdModal.classList.remove('active');
            }
        });
    }

    // ===== 부가세 신고 렌더 =====
    function renderVatView() {
        const tbody = document.getElementById('vat-tbody');
        const tfoot = document.getElementById('vat-tfoot');
        const cardContainer = document.getElementById('vat-summary-cards');

        if (!tbody || !tfoot || !cardContainer) return;

        // 1. 세금계산서 및 카드매출 기반 집계 (기간별 필터링 적용)
        const filteredSales = getFilteredData(state.salesData);
        const filteredPurchases = getFilteredData(state.purchaseData);
        const filteredCardSales = getFilteredData(state.cardSalesData);

        // 세금계산서 매출
        const salesTaxInvoiceSupply = filteredSales.reduce((sum, d) => sum + (d.supplyAmount || 0), 0);
        const salesTaxInvoiceTax = filteredSales.reduce((sum, d) => sum + (d.taxAmount || 0), 0);

        // 카드 매출 (VAT 포함 금액에서 공급가액과 세액 분리 계산: 공급가액 = 합계 / 1.1, 세액 = 합계 - 공급가액)
        const totalCardSalesAmount = filteredCardSales.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
        const cardSalesTax = Math.round(totalCardSalesAmount / 11);
        const cardSalesSupply = totalCardSalesAmount - cardSalesTax;

        // 최종 매출 합계
        const totalOutputVat = salesTaxInvoiceTax + cardSalesTax;
        const totalOutputSupply = salesTaxInvoiceSupply + cardSalesSupply;

        // 세금계산서 매입
        const purchaseTaxInvoiceSupply = filteredPurchases.reduce((sum, d) => sum + (d.supplyAmount || 0), 0);
        const purchaseTaxInvoiceTax = filteredPurchases.reduce((sum, d) => sum + (d.taxAmount || 0), 0);

        // 2. 신용카드 매입 기간별 필터링 기능
        function getFilteredVatCardData() {
            if (state.currentPeriod === 'all') return state.vatCardData;
            
            return state.vatCardData.filter(row => {
                if (state.currentPeriod === 'monthly') {
                    return row.month === state.selectedSubPeriod;
                } else if (state.currentPeriod === 'quarterly') {
                    const monthNum = parseInt(row.month.substring(5, 7), 10);
                    const q = Math.ceil(monthNum / 3);
                    const qStr = `${row.month.substring(0, 4)}-Q${q}`;
                    return qStr === state.selectedSubPeriod;
                }
                return true;
            });
        }

        const activeVatCardData = getFilteredVatCardData();

        // 3. 신용카드 매입 집계 및 렌더링 함수
        function updateVatCalculations() {
            let totalDedCount = 0;
            let totalDedSupply = 0;
            let totalDedTax = 0;
            let totalDedTotal = 0;

            let totalTotCount = 0;
            let totalTotSupply = 0;
            let totalTotTax = 0;
            let totalTotTotal = 0;

            // 모든 카드 데이터의 행별 합계 계산 (화면에 보이지 않는 행들도 데이터를 최신으로 유지)
            state.vatCardData.forEach(row => {
                row.dedTotal = (row.dedSupply || 0) + (row.dedTax || 0);
                row.totTotal = (row.totSupply || 0) + (row.totTax || 0);
            });

            // 현재 선택된 기간의 행들만 합산하여 요약 및 합계 렌더링
            activeVatCardData.forEach(row => {
                totalDedCount += (row.dedCount || 0);
                totalDedSupply += (row.dedSupply || 0);
                totalDedTax += (row.dedTax || 0);
                totalDedTotal += (row.dedTotal || 0);

                totalTotCount += (row.totCount || 0);
                totalTotSupply += (row.totSupply || 0);
                totalTotTax += (row.totTax || 0);
                totalTotTotal += (row.totTotal || 0);
            });

            // 상단 요약 카드 데이터
            const outputVat = totalOutputVat;
            const inputVat = purchaseTaxInvoiceTax + totalTotTax;
            const netVat = outputVat - inputVat;

            cardContainer.innerHTML = `
                ${createSummaryCard('blue', ICONS.sales, '매출세액 (세금계산서 + 카드매출)', formatCurrency(outputVat), `세금계산서: ${formatCurrency(salesTaxInvoiceTax)} · 카드매출: ${formatCurrency(cardSalesTax)}`)}
                ${createSummaryCard('rose', ICONS.purchase, '매입세액 (세금계산서 + 카드공제)', formatCurrency(inputVat), `세금계산서: ${formatCurrency(purchaseTaxInvoiceTax)} · 신용카드: ${formatCurrency(totalTotTax)}`)}
                ${createSummaryCard(netVat <= 0 ? 'emerald' : 'amber', ICONS.tax, '예상 납부(환급)세액', formatCurrency(Math.abs(netVat)), netVat <= 0 ? '<span class="positive">환급 예정 (매입세액 초과)</span>' : '<span class="negative">납부 필요 (매출세액 초과)</span>')}
            `;

            tfoot.innerHTML = `
                <tr>
                    <td class="text-center" style="text-align:center; border-right:1px solid var(--border-subtle); font-weight: 600;">합계</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${totalDedCount}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${formatCurrency(totalDedSupply)}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${formatCurrency(totalDedTax)}</td>
                    <td class="text-right" style="text-align:right; border-right:1px solid var(--border-subtle); font-weight: 600;">${formatCurrency(totalDedTotal)}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${totalTotCount}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${formatCurrency(totalTotSupply)}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${formatCurrency(totalTotTax)}</td>
                    <td class="text-right" style="text-align:right; font-weight: 600;">${formatCurrency(totalTotTotal)}</td>
                </tr>
            `;
        }

        // 4. 테이블 바디 그리기
        tbody.innerHTML = '';
        activeVatCardData.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center" style="text-align:center; border-right:1px solid var(--border-subtle); font-weight:500;">${row.month}</td>
                
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="dedCount" value="${row.dedCount || 0}">
                </td>
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="dedSupply" value="${row.dedSupply || 0}">
                </td>
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="dedTax" value="${row.dedTax || 0}">
                </td>
                <td class="text-right" id="dedTotal-${row.month}" style="text-align:right; border-right:1px solid var(--border-subtle); font-weight:500; padding-right:12px;">
                    ${formatCurrency(row.dedTotal || 0)}
                </td>
                
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="totCount" value="${row.totCount || 0}">
                </td>
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="totSupply" value="${row.totSupply || 0}">
                </td>
                <td class="text-right" style="text-align:right; padding: 2px 4px;">
                    <input type="number" class="vat-input" data-month="${row.month}" data-field="totTax" value="${row.totTax || 0}">
                </td>
                <td class="text-right" id="totTotal-${row.month}" style="text-align:right; font-weight:500; padding-right:12px;">
                    ${formatCurrency(row.totTotal || 0)}
                </td>
            `;
            tbody.appendChild(tr);
        });

        updateVatCalculations();

        // 5. 실시간 입력 이벤트 바인딩
        tbody.querySelectorAll('.vat-input').forEach(input => {
            input.addEventListener('input', e => {
                const month = e.target.dataset.month;
                const field = e.target.dataset.field;
                const value = parseInt(e.target.value, 10) || 0;

                const row = state.vatCardData.find(r => r.month === month);
                if (row) {
                    row[field] = value;
                    row.dedTotal = (row.dedSupply || 0) + (row.dedTax || 0);
                    row.totTotal = (row.totSupply || 0) + (row.totTax || 0);

                    document.getElementById(`dedTotal-${month}`).textContent = formatCurrency(row.dedTotal);
                    document.getElementById(`totTotal-${month}`).textContent = formatCurrency(row.totTotal);

                    updateVatCalculations();
                    localStorage.setItem('vat_card_data', JSON.stringify(state.vatCardData));
                }
            });
        });

        // 6. 초기화 버튼 이벤트 바인딩
        const resetBtn = document.getElementById('btn-reset-vat');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm('모든 신용카드 매입 내역을 초기값으로 되돌리시겠습니까?')) {
                    localStorage.removeItem('vat_card_data');
                    state.vatCardData = JSON.parse(JSON.stringify(DEFAULT_VAT_CARD_DATA));
                    renderVatView();
                }
            };
        }
    }

    // ===== 초기화 =====
    async function init() {
        // 로딩 화면
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">데이터 로딩 중...</div>';
        document.body.appendChild(loadingOverlay);

        await loadData();
        bindEvents();
        renderDashboard();

        // 로딩 완료
        setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => loadingOverlay.remove(), 500);
        }, 300);
    }

    // 시작
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
