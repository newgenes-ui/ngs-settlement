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
        charts: {}
    };

    // ===== CSV 파싱 =====
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
        const lines = text.split('\n').filter(l => l.trim());
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

    // ===== 데이터 로드 =====
    async function loadData() {
        try {
            const [salesRes, cardRes, purchaseRes, extInventoryRes] = await Promise.all([
                fetch('매출.csv'),
                fetch('카드매출전표.csv'),
                fetch('매입.csv'),
                fetch('ExT 재고매입.csv')
            ]);

            const salesText = await salesRes.text();
            const cardText = await cardRes.text();
            const purchaseText = await purchaseRes.text();
            const extInventoryText = await extInventoryRes.text();

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
            const salesLines = salesText.split('\n').filter(l => l.trim());
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
            const cardLines = cardText.split('\n').filter(l => l.trim());
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
            const purchaseLines = purchaseText.split('\n').filter(l => l.trim());
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

            // ExT 재고매입 CSV 파싱
            const extInventoryLines = extInventoryText.split('\n').filter(l => l.trim());
            state.extInventoryRawData = [];
            for (let i = 6; i < extInventoryLines.length; i++) {
                const v = parseCSVLine(extInventoryLines[i]);
                if (!v[0] || v[1] === '총합계') continue;
                state.extInventoryRawData.push({
                    date: v[0],
                    itemName: v[1],
                    qty: parseInt(v[2]) || 0,
                    unitPrice: parseAmount(v[3]),
                    supplyAmount: parseAmount(v[4]),
                    taxAmount: parseAmount(v[5])
                });
            }

            // 배지 업데이트
            document.getElementById('badge-sales').textContent = state.salesData.length;
            document.getElementById('badge-inventory').textContent = '7'; // ExT 제품군 수 (고유 품목 수)
            document.getElementById('badge-card-sales').textContent = state.cardSalesData.length;
            document.getElementById('badge-purchases').textContent = state.purchaseData.length;

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
        
        const totalPurchases = purchases.reduce((s, r) => s + r.totalAmount, 0);
        const totalPurchaseSupply = purchases.reduce((s, r) => s + r.supplyAmount, 0);
        const totalPurchaseTax = purchases.reduce((s, r) => s + r.taxAmount, 0);
        
        const profit = totalSupply - totalPurchaseSupply;
        const profitRate = totalSupply !== 0 ? ((profit / totalSupply) * 100).toFixed(1) : '0.0';

        const html = [
            createSummaryCard('indigo', ICONS.sales, '매출 합계',
                formatCurrency(totalSales),
                `공급가액: ${formatCurrency(totalSupply)} · 부가세: ${formatCurrency(totalSalesTax)} · ${sales.length}건`),
            createSummaryCard('blue', ICONS.card, '카드매출 합계',
                formatCurrency(totalCardSales),
                `${cards.length}건의 카드거래`),
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
        state.purchaseData.forEach(r => { const m = getMonth(r.date); if (m) months.add(m); });
        const sortedMonths = [...months].sort();

        const salesByMonth = {};
        const purchasesByMonth = {};
        sortedMonths.forEach(m => { salesByMonth[m] = 0; purchasesByMonth[m] = 0; });
        state.salesData.forEach(r => {
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
        state.purchaseData.forEach(r => { const q = getQuarter(r.date); if (q) quarters.add(q); });
        const sortedQuarters = [...quarters].sort();

        const salesByQ = {};
        const purchasesByQ = {};
        sortedQuarters.forEach(q => { salesByQ[q] = 0; purchasesByQ[q] = 0; });
        state.salesData.forEach(r => {
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

        const rows = reversed.map(d => {
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
        const allData = getFilteredData(state.salesData);
        const data = allData.filter(isExtProduct);
        const filtered = searchTerm
            ? data.filter(r =>
                (r.buyerName && r.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.itemName && r.itemName.toLowerCase().includes(searchTerm.toLowerCase())))
            : data;

        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);

        const tbody = document.getElementById('ext-sales-tbody');
        tbody.innerHTML = filtered.map((r) => `
            <tr data-type="sales" data-idx="${state.salesData.indexOf(r)}">
                <td>${r.date}</td>
                <td>${r.buyerName || '-'}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;">${r.itemName || '-'}</td>
                <td class="text-right amount ${r.totalAmount < 0 ? 'negative' : ''}">${r.totalAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.supplyAmount.toLocaleString()}</td>
                <td class="text-right amount">${r.taxAmount.toLocaleString()}</td>
                <td><span class="tag ${r.classification === '수정세금계사항' || r.classification === '수정세금계산서' ? 'correction' : 'normal'}">${r.classification === '수정세금계산서' ? '수정' : '일반'}</span></td>
            </tr>
        `).join('');

        document.getElementById('ext-sales-footer').innerHTML = `
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

        document.getElementById('card-sales-summary-cards').innerHTML = [
            createSummaryCard('blue', ICONS.card, '카드매출 합계', formatCurrency(totalAmount), `${data.length}일 거래`),
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
    function classifyExtProduct(itemName) {
        const name = (itemName || '').toLowerCase();
        if (!name.includes('extransfection') && !name.includes('ext-') && !name.includes('exttransfection')) {
            return null;
        }
        if (name.includes('192')) return 'starter_192';
        if (name.includes('96') && name.includes('starter')) return 'starter_96';
        if (name.includes('tube')) return 'tube';
        
        const is25 = name.includes('25') || name.includes('25k');
        const is10 = name.includes('10 ') || name.includes('10u') || name.includes('10μ') || name.includes('10 μ');
        const is100 = name.includes('100 ') || name.includes('100u') || name.includes('100μ') || name.includes('100 μ') || name.includes('10096k') || name.includes('10025k') || (!name.includes('10 ') && !name.includes('10u') && !name.includes('10μ'));
        
        if (is10) {
            if (is25) return 'kit_10_25';
            return 'kit_10_96';
        }
        if (is100) {
            if (is25) return 'kit_100_25';
            return 'kit_100_96';
        }
        return 'kit_100_96';
    }

    function renderInventoryView() {
        const categories = [
            { id: 'starter_192', name: 'ExT Starter Pack (192 rxn)', spec: '192 reactions [set]', initQty: 20, initAmount: 170000000, unitPrice: 8500000 },
            { id: 'starter_96', name: 'ExT Starter Pack (96 rxn)', spec: '96 reactions [set]', initQty: 3, initAmount: 21675000, unitPrice: 7225000 },
            { id: 'kit_10_25', name: 'ExT 10 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 11, initAmount: 4200000, unitPrice: 420000 },
            { id: 'kit_100_25', name: 'ExT 100 ul Kit (25 rxn)', spec: '25 x 2 reactions [kit]', initQty: 11, initAmount: 4200000, unitPrice: 420000 },
            { id: 'kit_10_96', name: 'ExT 10 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 162, initAmount: 200000000, unitPrice: 1250000 },
            { id: 'kit_100_96', name: 'ExT 100 ul Kit (96 rxn)', spec: '96 x 2 reactions [kit]', initQty: 132, initAmount: 162500000, unitPrice: 1250000 },
            { id: 'tube', name: 'ExTransfection Tube', spec: 'EXT50T', initQty: 2, initAmount: 560000, unitPrice: 280000 }
        ];

        const soldCounts = {};
        const soldAmounts = {};
        categories.forEach(c => {
            soldCounts[c.id] = 0;
            soldAmounts[c.id] = 0;
        });

        // 당기 매출 및 판매량 집계
        state.salesData.forEach(r => {
            const catId = classifyExtProduct(r.itemName);
            if (catId) {
                const qty = parseInt(r.itemQty) || 0;
                const supply = parseAmount(r.itemSupply) || 0;
                soldCounts[catId] += qty;
                soldAmounts[catId] += supply;
            }
        });

        const totalInitQty = categories.reduce((s, c) => s + c.initQty, 0);
        const totalInitAmount = categories.reduce((s, c) => s + c.initAmount, 0);
        
        const totalSoldQty = Object.values(soldCounts).reduce((s, v) => s + v, 0);
        const totalSoldAmount = Object.values(soldAmounts).reduce((s, v) => s + v, 0);
        
        const totalStockQty = totalInitQty - totalSoldQty;
        const totalStockAmount = categories.reduce((s, c) => {
            const sold = soldCounts[c.id] || 0;
            const stock = Math.max(c.initQty - sold, 0);
            return s + (stock * c.unitPrice);
        }, 0);

        document.getElementById('inventory-summary-cards').innerHTML = [
            createSummaryCard('indigo', ICONS.purchase, '기초 입고 현황', `${totalInitQty}개`, `매입액: ${formatCurrency(totalInitAmount)}`),
            createSummaryCard('blue', ICONS.sales, '당기 매출 현황', `${totalSoldQty}개`, `매출액: ${formatCurrency(totalSoldAmount)}`),
            createSummaryCard('emerald', ICONS.profit, '현재 재고 현황', `${totalStockQty}개`, `평가액: ${formatCurrency(totalStockAmount)}`)
        ].join('');

        const tbody = document.getElementById('inventory-tbody');
        tbody.innerHTML = categories.map(c => {
            const soldQty = soldCounts[c.id] || 0;
            const soldAmt = soldAmounts[c.id] || 0;
            const stockQty = c.initQty - soldQty;
            const stockAmt = Math.max(stockQty, 0) * c.unitPrice;
            
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
                    <td style="font-size:0.82rem;color:var(--text-secondary);">${c.spec}</td>
                    <td class="text-center" style="font-weight:600;">${c.initQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;">${c.initAmount.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:600;color:var(--accent-indigo);">${soldQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;color:var(--accent-indigo);">${soldAmt.toLocaleString()}원</td>
                    <td class="text-center" style="font-weight:700;color:${stockQty <= 5 ? 'var(--accent-rose)' : 'var(--text-primary)'}">${stockQty}개</td>
                    <td class="text-right" style="font-feature-settings:'tnum';font-variant-numeric:tabular-nums;font-weight:600;">${stockAmt.toLocaleString()}원</td>
                    <td class="text-center">${statusHTML}</td>
                </tr>
            `;
        }).join('');

        renderExtSalesList();
    }

    // ===== 뷰 전환 =====
    function switchView(viewName) {
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
            'card-sales': ['카드매출 내역', '카드매출전표 세부내역을 확인합니다.'],
            'purchases': ['매입 내역', '세금계산서 기반 매입 세부내역을 확인합니다.']
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
            case 'card-sales': renderCardSalesView(); break;
            case 'purchases': renderPurchasesView(); break;
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

        if (type === 'sales') {
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

        // ESC로 모달 닫기
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.getElementById('detail-modal').classList.remove('active');
            }
        });
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
