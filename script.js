let imgData = { logo: '', seal: '' };
let rowCount = 0;

window.onload = () => {
    updateStorageLists();
    loadData();
    document.getElementById('remarks').addEventListener('input', updatePreview);
    setTimeout(updatePreview, 500);
};

function getFormData() {
    const data = {
        docType: document.querySelector('input[name="docType"]:checked').value,
        docNumber: document.getElementById('docNumber').value,
        issueDate: document.getElementById('issueDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        clientName: document.getElementById('clientName').value,
        subject: document.getElementById('subject').value,
        issuerName: document.getElementById('issuerName').value,
        issuerAddress: document.getElementById('issuerAddress').value,
        issuerTel: document.getElementById('issuerTel').value,
        invoiceId: document.getElementById('invoiceId').value,
        bankName: document.getElementById('bankName').value,
        branchName: document.getElementById('branchName').value,
        accountType: document.getElementById('accountType').value,
        accountNumber: document.getElementById('accountNumber').value,
        accountHolder: document.getElementById('accountHolder').value,
        withholding: document.getElementById('withholding').checked,
        remarks: document.getElementById('remarks').value,
        currency: document.getElementById('currency').value,
        imgData: imgData,
        items: []
    };
    document.querySelectorAll('.item-row').forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        data.items.push({
            date: row.querySelector('.row-date').value,
            sync: cb ? cb.checked : false,
            name: row.querySelector('.row-name').value,
            qty: row.querySelector('.row-qty').value,
            price: row.querySelector('.row-price').value,
            tax: row.querySelector('.row-tax').value
        });
    });
    return data;
}

function applyDataToUI(data) {
    if (data.docType) {
        document.querySelector(`input[name="docType"][value="${data.docType}"]`).checked = true;
    }
    const fields = ['docNumber', 'issueDate', 'expiryDate', 'clientName', 'subject', 'issuerName', 'issuerAddress', 'issuerTel', 'invoiceId', 'bankName', 'branchName', 'accountType', 'accountNumber', 'accountHolder', 'remarks', 'currency'];
    fields.forEach(id => {
        if (data[id] !== undefined && document.getElementById(id)) {
            document.getElementById(id).value = data[id];
        }
    });
    if (data.withholding !== undefined) document.getElementById('withholding').checked = data.withholding;
    if (data.imgData) imgData = data.imgData;

    document.getElementById('items-container').innerHTML = ''; 
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => addItemRow(item));
    } else {
        addItemRow();
    }
    updateUI();
    updatePreview();
}

function saveData() {
    try {
        localStorage.setItem('docMakerProData', JSON.stringify(getFormData()));
    } catch (e) {
        console.warn("画像サイズ等の制限により自動保存できませんでした");
    }
}

function loadData() {
    const saved = localStorage.getItem('docMakerProData');
    if (saved) {
        try {
            applyDataToUI(JSON.parse(saved));
        } catch (e) {
            addItemRow();
            document.getElementById('issueDate').valueAsDate = new Date();
        }
    } else {
        addItemRow();
        document.getElementById('issueDate').valueAsDate = new Date();
    }
    updateUI();
}

function updateStorageLists() {
    const tSelect = document.getElementById('templateSelect');
    const hSelect = document.getElementById('historySelect');
    if(!tSelect || !hSelect) return;
    
    tSelect.innerHTML = '<option value="">テンプレートを選択...</option>';
    const templates = JSON.parse(localStorage.getItem('docMakerTemplates') || '[]');
    templates.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        tSelect.appendChild(opt);
    });

    hSelect.innerHTML = '<option value="">過去の履歴を選択...</option>';
    const history = JSON.parse(localStorage.getItem('docMakerHistory') || '[]');
    history.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = h.summary;
        hSelect.appendChild(opt);
    });
}

function saveTemplate() {
    const name = prompt("保存するテンプレートの名前を入力してください\n（例：A社用、基本フォーマット等）");
    if (!name) return;
    try {
        const templates = JSON.parse(localStorage.getItem('docMakerTemplates') || '[]');
        templates.push({ id: Date.now().toString(), name: name, data: getFormData() });
        localStorage.setItem('docMakerTemplates', JSON.stringify(templates));
        updateStorageLists();
        alert("テンプレートを保存しました。");
    } catch(e) { alert("保存容量の上限に達しました。画像のサイズを小さくしてください。"); }
}

function loadTemplate() {
    const id = document.getElementById('templateSelect').value;
    if (!id) return;
    const templates = JSON.parse(localStorage.getItem('docMakerTemplates') || '[]');
    const t = templates.find(x => x.id === id);
    if (t) {
        applyDataToUI(t.data);
        saveData();
    }
}

function deleteTemplate() {
    const id = document.getElementById('templateSelect').value;
    if (!id) return;
    if (!confirm("選択したテンプレートを削除しますか？")) return;
    let templates = JSON.parse(localStorage.getItem('docMakerTemplates') || '[]');
    templates = templates.filter(x => x.id !== id);
    localStorage.setItem('docMakerTemplates', JSON.stringify(templates));
    updateStorageLists();
}

function loadHistory() {
    const id = document.getElementById('historySelect').value;
    if (!id) return;
    const history = JSON.parse(localStorage.getItem('docMakerHistory') || '[]');
    const h = history.find(x => x.id === id);
    if (h) {
        applyDataToUI(h.data);
        saveData();
        alert("過去のデータを複製しました。日付などを適宜変更してください。");
    }
}

function deleteHistory() {
    const id = document.getElementById('historySelect').value;
    if (!id) return;
    if (!confirm("選択した履歴を削除しますか？")) return;
    let history = JSON.parse(localStorage.getItem('docMakerHistory') || '[]');
    history = history.filter(x => x.id !== id);
    localStorage.setItem('docMakerHistory', JSON.stringify(history));
    updateStorageLists();
}

function adjustScale() {
    const container = document.getElementById('preview-section');
    const wrapper = document.getElementById('preview-wrapper');
    if(!container || !wrapper) return;

    const containerWidth = container.offsetWidth - 40;
    const containerHeight = container.offsetHeight - 40;
    const a4Width = 794; 
    const a4Height = 1122; 

    const scale = Math.min(containerWidth / a4Width, containerHeight / a4Height);
    
    const finalScale = window.innerWidth < 1100 ? Math.max(scale, 0.35) : scale;
    wrapper.style.transform = `scale(${finalScale})`;
}

function handleFile(input, type) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgData[type] = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function handleNumberInput(el) {
    let val = el.value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    val = val.replace(/[^\d]/g, '');
    if (el.maxLength > 0 && val.length > el.maxLength) val = val.slice(0, el.maxLength);
    el.value = val;
    updatePreview();
}

function handleTelInput(el) {
    let val = el.value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^\d]/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    let f = (val.length <= 3) ? val : (val.length <= 7) ? val.slice(0, 3) + '-' + val.slice(3) : val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7);
    el.value = f;
    updatePreview();
}

function handleHolderConvert(el) {
    let val = el.value;
    val = val.replace(/[\u3041-\u3096]/g, (m) => String.fromCharCode(m.charCodeAt(0) + 0x60));
    el.value = val.toUpperCase();
}

function addItemRow(initData = null) {
    rowCount++;
    const container = document.getElementById('items-container');
    const div = document.createElement('div');
    div.className = 'item-row';
    const isFirst = container.children.length === 0;
    
    const dateVal = initData ? initData.date : "";
    const syncCheck = initData && initData.sync ? "checked" : "";
    const nameVal = initData ? initData.name : "";
    const qtyVal = initData ? initData.qty : "";
    const priceVal = initData ? initData.price : "";
    const taxVal = initData ? initData.tax : "0.1";

    div.innerHTML = `
        <div class="item-row-top">
            <input type="date" class="row-date" name="row-date-${rowCount}" max="9999-12-31" value="${dateVal}" style="flex:1.5;" oninput="updatePreview()">
            ${!isFirst ? `<label style="font-size:9px; display:flex; align-items:center;"><input type="checkbox" name="row-sync-${rowCount}" ${syncCheck} onchange="syncDate(this)" style="margin-right:2px;">同日</label>` : '<span></span>'}
            <input type="text" class="row-name" name="row-name-${rowCount}" placeholder="品目" value="${nameVal}" style="flex:3;" oninput="updatePreview()">
            <button onclick="this.parentElement.parentElement.remove(); updatePreview()" style="border:none; background:none; font-size:18px; cursor:pointer;">✕</button>
        </div>
        <div class="item-row-bottom">
            <input type="text" class="row-qty" name="row-qty-${rowCount}" placeholder="数" value="${qtyVal}" style="flex:1;" oninput="handleNumberInput(this)">
            <input type="text" class="row-price" name="row-price-${rowCount}" placeholder="単価" value="${priceVal}" style="flex:2;" oninput="handleNumberInput(this)">
            <select class="row-tax" name="row-tax-${rowCount}" style="flex:1.5;" onchange="updatePreview()">
                <option value="0.1" ${taxVal === "0.1" ? "selected" : ""}>10%</option>
                <option value="0.08" ${taxVal === "0.08" ? "selected" : ""}>8%</option>
                <option value="0" ${taxVal === "0" ? "selected" : ""}>対象外</option>
            </select>
        </div>`;
    container.appendChild(div);
    if (!initData) updatePreview();
}

function syncDate(checkbox) {
    const firstDate = document.querySelector('.row-date').value;
    const target = checkbox.closest('.item-row').querySelector('.row-date');
    if (checkbox.checked) { target.value = firstDate; target.readOnly = true; } 
    else { target.readOnly = false; }
    updatePreview();
}

function updateUI() {
    const type = document.querySelector('input[name="docType"]:checked').value;
    document.getElementById('expiryLabel').innerText = (type === "見積書") ? "有効期限" : (type === "納品書") ? "納品日" : "お支払期限";
    document.getElementById('bank-info-area').style.display = (type === "請求書") ? "block" : "none";
    updatePreview();
}

function updatePreview() {
    const firstDateInput = document.querySelector('.row-date');
    const firstDate = firstDateInput ? firstDateInput.value : "";
    document.querySelectorAll('.item-row').forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb && cb.checked) { row.querySelector('.row-date').value = firstDate; }
    });

    const type = document.querySelector('input[name="docType"]:checked').value;
    const client = document.getElementById('clientName').value || "〇〇 株式会社 御中";
    const subject = document.getElementById('subject').value;
    const docNo = document.getElementById('docNumber').value;
    const issueDate = document.getElementById('issueDate').value || "---";
    const expiryLabel = document.getElementById('expiryLabel').innerText;
    const expiryDate = document.getElementById('expiryDate').value || "---";
    const sym = { JPY:"¥", USD:"$", EUR:"€" }[document.getElementById('currency').value];
    
    const iName = document.getElementById('issuerName').value || "（氏名を入力）";
    const iAddr = document.getElementById('issuerAddress').value || "";
    const iTel = document.getElementById('issuerTel').value || "";
    const invId = document.getElementById('invoiceId').value || "";
    const rem = document.getElementById('remarks').value || "";
    const branchName = document.getElementById('branchName').value;
    const branchText = branchName ? branchName + "支店" : "";

    let sub10 = 0, sub8 = 0, subEx = 0, rowsHtml = "";
    document.querySelectorAll('.item-row').forEach(row => {
        const date = row.querySelector('.row-date').value || "---";
        const name = row.querySelector('.row-name').value || "---";
        const qty = Number(row.querySelector('.row-qty').value) || 0;
        const price = Number(row.querySelector('.row-price').value) || 0;
        const rate = Number(row.querySelector('.row-tax').value);
        const total = qty * price;
        if(rate === 0.1) sub10 += total; else if(rate === 0.08) sub8 += total; else subEx += total;
        
        const rateText = rate === 0 ? "対象外" : (rate * 100) + "%";
        
        rowsHtml += `<tr style="border-bottom:1px solid #eee; font-size:10px;"><td>${date}</td><td>${name}</td><td style="text-align:right;">${qty.toLocaleString()}</td><td style="text-align:right;">${sym}${price.toLocaleString()}</td><td style="text-align:center;">${rateText}</td><td style="text-align:right;">${sym}${total.toLocaleString()}</td></tr>`;
    });

    const tax10 = Math.floor(sub10 * 0.1), tax8 = Math.floor(sub8 * 0.08);
    const useWith = document.getElementById('withholding').checked;
    const grandSub = sub10 + sub8 + subEx;
    const withTax = useWith ? Math.floor(grandSub * 0.1021) : 0;
    const finalTotal = grandSub + tax10 + tax8 - withTax;

    const logoHtml = imgData.logo ? `<img src="${imgData.logo}" style="max-height:40px; position:absolute; top:0; left:0;">` : "";
    const sealHtml = imgData.seal ? `<img src="${imgData.seal}" style="max-height:50px; position:absolute; right:0; top:-5px; opacity:0.8; z-index:0;">` : "";

    let taxBreakdownHtml = "";
    if (sub10 > 0 || sub8 > 0 || subEx > 0) {
        taxBreakdownHtml = `<div style="font-size:9px; color:#666; line-height:1.4;">`;
        if (sub10 > 0) taxBreakdownHtml += `<div>10%対象: ${sym}${sub10.toLocaleString()} (税: ${sym}${tax10.toLocaleString()})</div>`;
        if (sub8 > 0) taxBreakdownHtml += `<div>8%対象: ${sym}${sub8.toLocaleString()} (税: ${sym}${tax8.toLocaleString()})</div>`;
        if (subEx > 0) taxBreakdownHtml += `<div>対象外: ${sym}${subEx.toLocaleString()}</div>`;
        taxBreakdownHtml += `</div>`;
    }

    document.getElementById('pdf-content').innerHTML = `
        <div style="font-family:sans-serif; color:#333; line-height:1.4; font-size:11px; position:relative;">
            ${logoHtml}
            <div style="text-align:right; margin-bottom:10px;"><p>発行日: ${issueDate}</p>${docNo ? `<p>No: ${docNo}</p>` : ""}</div>
            <h1 style="color:#007aff; font-size:22px; text-align:center; margin:10px 0;">御${type}</h1>
            <div style="display:flex; justify-content:space-between;">
                <div style="width:55%;">
                    <p style="font-size:14px; border-bottom:1px solid #000;">${client}</p>
                    ${subject ? `<p style="margin-top:5px; font-weight:bold;">件名：${subject}</p>` : ""}
                    <p style="margin-top:5px;">${expiryLabel}：${expiryDate}</p>
                </div>
                <div style="text-align:right; width:43%; position:relative;">
                    <div><p style="font-weight:bold;">${iName}</p></div>
                    ${sealHtml}
                    <div><p style="font-size:9px;">${iAddr}</p>${iTel ? `<p style="font-size:9px;">TEL: ${iTel}</p>` : ""}${invId ? `<p style="font-weight:bold; font-size:9px;">T${invId}</p>` : ""}</div>
                </div>
            </div>
            <div style="background:#f0f7ff; padding:10px; text-align:center; border-radius:8px; margin:15px 0;">
                <p style="font-size:10px; color:#007aff; margin:0;">合計金額（税込）</p>
                <p style="font-size:24px; font-weight:bold; margin:0;">${sym}${finalTotal.toLocaleString()}-</p>
            </div>
            <table style="width:100%; border-collapse:collapse; margin-bottom:10px; table-layout:fixed;">
                <thead style="background:#f8f9fa; border-bottom:2px solid #007aff;">
                    <tr><th style="width:20%;">日付</th><th style="width:30%;">内容</th><th style="width:10%; text-align:right;">数</th><th style="width:15%; text-align:right;">単価</th><th style="width:10%; text-align:center;">税</th><th style="width:15%; text-align:right;">金額</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            
            <div style="display:flex; justify-content:space-between; margin-top:5px;">
                <div style="width:45%; align-self:flex-end;">
                    ${taxBreakdownHtml}
                </div>
                <div style="width:50%; border-top:2px solid #333; padding-top:5px; font-size:10px;">
                    <div style="display:flex; justify-content:space-between;"><span>小計</span><span>${sym}${grandSub.toLocaleString()}</span></div>
                    <div style="display:flex; justify-content:space-between;"><span>消費税</span><span>${sym}${(tax10+tax8).toLocaleString()}</span></div>
                    ${useWith ? `<div style="display:flex; justify-content:space-between; color:#d00000;"><span>源泉税</span><span>▲${sym}${withTax.toLocaleString()}</span></div>` : ""}
                    <div style="display:flex; justify-content:space-between; font-weight:bold; border-top:1px solid #ccc; margin-top:3px; padding-top:3px;"><span>合計</span><span>${sym}${finalTotal.toLocaleString()}</span></div>
                </div>
            </div>
            
            ${type === "請求書" ? `<div style="margin-top:10px; border:1px solid #ddd; padding:8px; border-radius:6px; font-size:9px;"><p style="font-weight:bold; color:#007aff;">【振込先】</p><p>${document.getElementById('bankName').value || "---"} ${branchText} ${document.getElementById('accountType').value} ${document.getElementById('accountNumber').value || ""}</p><p>名義：${document.getElementById('accountHolder').value || "---"}</p></div>` : ""}
            ${rem ? `<div style="margin-top:10px; font-size:9px; color:#555;"><p style="font-weight:bold;">【備考】</p><p style="white-space:pre-wrap;">${rem}</p></div>` : ""}
        </div>`;
    adjustScale();
    saveData();
}

function handleExport() {
    const errs = [];
    if(!document.getElementById('clientName').value) errs.push("取引先名を入力してください");
    if(!document.getElementById('issuerName').value) errs.push("発行者名を入力してください");
    if(errs.length > 0) { alert(errs.join("\n")); return; }
    
    const currentData = getFormData();
    try {
        let history = JSON.parse(localStorage.getItem('docMakerHistory') || '[]');
        const dateStr = new Date().toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
        const client = currentData.clientName || '件名なし';
        history.unshift({
            id: Date.now().toString(),
            summary: `${dateStr} - ${client}`,
            data: currentData
        });
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('docMakerHistory', JSON.stringify(history));
        updateStorageLists();
    } catch(e) { console.warn("履歴保存エラー"); }

    document.getElementById('ad-overlay').style.display = "flex";
    const bar = document.querySelector('.loader-bar');
    setTimeout(() => { bar.style.width = "100%"; }, 50);

    let t = 10;
    const timer = setInterval(() => {
        t--;
        document.getElementById('timer').innerText = t;
        if(t <= 0) {
            clearInterval(timer);
            exportPDF();
        }
    }, 1000);
}

function exportPDF() {
    const el = document.getElementById('pdf-content');
    html2pdf().set({ margin:0, filename: 'document.pdf', jsPDF: { unit:'mm', format:'a4' } }).from(el).save().then(() => {
        document.getElementById('ad-overlay').style.display = "none";
        document.querySelector('.loader-bar').style.width = "0%";
    });
}
window.onresize = adjustScale;
