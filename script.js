let isComposing = false; 
let imgData = { logo: '', seal: '' };

window.onload = () => {
    addItemRow(); 
    document.getElementById('issueDate').valueAsDate = new Date();
    
    const holderInput = document.getElementById('accountHolder');
    holderInput.addEventListener('compositionstart', () => { isComposing = true; });
    holderInput.addEventListener('compositionend', (e) => {
        isComposing = false;
        handleHolderConvert(e.target);
        updatePreview();
    });
    holderInput.addEventListener('input', (e) => {
        if (!isComposing) { handleHolderConvert(e.target); }
        updatePreview();
    });

    document.getElementById('remarks').addEventListener('input', updatePreview);
    
    // 修正：初期表示を確実にするための遅延実行
    setTimeout(updatePreview, 500);
};

// 修正：スマホの画面サイズに合わせてプレビューを縮小するロジック
function adjustScale() {
    const container = document.getElementById('preview-section');
    const wrapper = document.getElementById('preview-wrapper');
    if(!container || !wrapper) return;

    const containerWidth = container.offsetWidth - 40;
    const containerHeight = container.offsetHeight - 40;
    const a4Width = 794; // 210mm in px approx
    const a4Height = 1122; // 297mm in px approx

    const scale = Math.min(containerWidth / a4Width, containerHeight / a4Height);
    
    // スマホでは最低限見えるサイズを保証
    const finalScale = window.innerWidth < 1100 ? Math.max(scale, 0.35) : scale;
    wrapper.style.transform = `scale(${finalScale})`;
}

// 他の関数（handleFile, handleNumberInput等）は前回と同じ
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
    el.value = val.replace(/[^\d]/g, '');
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
    val = val.replace(/[^\u30A0-\u30FF\u30FC\s　A-Za-z0-9]/g, '');
    el.value = val.toUpperCase();
}

function addItemRow() {
    const container = document.getElementById('items-container');
    const div = document.createElement('div');
    div.className = 'item-row';
    const isFirst = container.children.length === 0;
    div.innerHTML = `
        <div class="item-row-top">
            <input type="date" class="row-date" style="flex:1.5;" oninput="updatePreview()">
            ${!isFirst ? `<label style="font-size:9px;"><input type="checkbox" onchange="syncDate(this)">同日</label>` : '<span></span>'}
            <input type="text" class="row-name" placeholder="品目" style="flex:3;" oninput="updatePreview()">
            <button onclick="this.parentElement.parentElement.remove(); updatePreview()" style="border:none; background:none; font-size:18px;">✕</button>
        </div>
        <div class="item-row-bottom">
            <input type="text" class="row-qty" placeholder="数" style="flex:1;" oninput="handleNumberInput(this)">
            <input type="text" class="row-price" placeholder="単価" style="flex:2;" oninput="handleNumberInput(this)">
            <select class="row-tax" style="flex:1.5;" onchange="updatePreview()">
                <option value="0.1">10%</option><option value="0.08">8%</option><option value="0">対象外</option>
            </select>
        </div>`;
    container.appendChild(div);
    updatePreview();
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
    const type = document.querySelector('input[name="docType"]:checked').value;
    const client = document.getElementById('clientName').value || "〇〇 株式会社 御中";
    const subject = document.getElementById('subject').value;
    const docNo = document.getElementById('docNumber').value;
    const issueDate = document.getElementById('issueDate').value || "---";
    const expiryDate = document.getElementById('expiryDate').value || "---";
    const sym = { JPY:"¥", USD:"$", EUR:"€" }[document.getElementById('currency').value];
    
    const iName = document.getElementById('issuerName').value || "（氏名を入力）";
    const iAddr = document.getElementById('issuerAddress').value || "";
    const iTel = document.getElementById('issuerTel').value || "";
    const invId = document.getElementById('invoiceId').value || "";
    const rem = document.getElementById('remarks').value || "";

    let sub10 = 0, sub8 = 0, subEx = 0, rowsHtml = "";
    document.querySelectorAll('.item-row').forEach(row => {
        const date = row.querySelector('.row-date').value || "---";
        const name = row.querySelector('.row-name').value || "---";
        const qty = Number(row.querySelector('.row-qty').value) || 0;
        const price = Number(row.querySelector('.row-price').value) || 0;
        const rate = Number(row.querySelector('.row-tax').value);
        const total = qty * price;
        if(rate === 0.1) sub10 += total; else if(rate === 0.08) sub8 += total; else subEx += total;
        rowsHtml += `<tr style="border-bottom:1px solid #eee; font-size:10px;"><td>${date}</td><td>${name}</td><td style="text-align:right;">${qty.toLocaleString()}</td><td style="text-align:right;">${sym}${price.toLocaleString()}</td><td style="text-align:center;">${rate*100}%</td><td style="text-align:right;">${sym}${total.toLocaleString()}</td></tr>`;
    });

    const tax10 = Math.floor(sub10 * 0.1), tax8 = Math.floor(sub8 * 0.08);
    const useWith = document.getElementById('withholding').checked;
    const grandSub = sub10 + sub8 + subEx;
    const withTax = useWith ? Math.floor(grandSub * 0.1021) : 0;
    const finalTotal = grandSub + tax10 + tax8 - withTax;

    const logoHtml = imgData.logo ? `<img src="${imgData.logo}" style="max-height:40px; position:absolute; top:0; left:0;">` : "";
    const sealHtml = imgData.seal ? `<img src="${imgData.seal}" style="max-height:50px; position:absolute; right:0; top:-5px; opacity:0.8; z-index:0;">` : "";

    document.getElementById('pdf-content').innerHTML = `
        <div style="font-family:sans-serif; color:#333; line-height:1.4; font-size:11px; position:relative;">
            ${logoHtml}
            <div style="text-align:right; margin-bottom:10px;"><p>発行日: ${issueDate}</p>${docNo ? `<p>No: ${docNo}</p>` : ""}</div>
            <h1 style="color:#007aff; font-size:22px; text-align:center; margin:10px 0;">御${type}</h1>
            <div style="display:flex; justify-content:space-between;">
                <div style="width:55%;"><p style="font-size:14px; border-bottom:1px solid #000;">${client}</p>${subject ? `<p style="margin-top:5px; font-weight:bold;">件名：${subject}</p>` : ""}</div>
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
            <div style="display:flex; justify-content:flex-end;">
                <div style="width:45%; border-top:2px solid #333; padding-top:5px; font-size:10px;">
                    <div style="display:flex; justify-content:space-between;"><span>小計</span><span>${sym}${grandSub.toLocaleString()}</span></div>
                    <div style="display:flex; justify-content:space-between;"><span>消費税</span><span>${sym}${(tax10+tax8).toLocaleString()}</span></div>
                    ${useWith ? `<div style="display:flex; justify-content:space-between; color:#d00000;"><span>源泉税</span><span>▲${sym}${withTax.toLocaleString()}</span></div>` : ""}
                    <div style="display:flex; justify-content:space-between; font-weight:bold; border-top:1px solid #ccc;"><span>合計</span><span>${sym}${finalTotal.toLocaleString()}</span></div>
                </div>
            </div>
            ${type === "請求書" ? `<div style="margin-top:10px; border:1px solid #ddd; padding:8px; border-radius:6px; font-size:9px;"><p style="font-weight:bold; color:#007aff;">【振込先】</p><p>${document.getElementById('bankName').value || "---"} ${document.getElementById('branchName').value || ""} ${document.getElementById('accountType').value} ${document.getElementById('accountNumber').value || ""}</p><p>名義：${document.getElementById('accountHolder').value || "---"}</p></div>` : ""}
            ${rem ? `<div style="margin-top:10px; font-size:9px; color:#555;"><p style="font-weight:bold;">【備考】</p><p style="white-space:pre-wrap;">${rem}</p></div>` : ""}
        </div>`;
    adjustScale();
}

function handleExport() {
    const errs = [];
    if(!document.getElementById('clientName').value) errs.push("取引先名を入力してください");
    if(!document.getElementById('issuerName').value) errs.push("発行者名を入力してください");
    if(errs.length > 0) { alert(errs.join("\n")); return; }
    
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
