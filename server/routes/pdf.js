const express = require("express");

const router = express.Router();

const PDFDocument = require("pdfkit");

const path = require("path");

const fs = require("fs");

const db = require("../database");




// ===============================
// إضافة رأس الشركة + اللوجو
// ===============================

function addCompanyHeader(doc, callback){


db.get(

`
SELECT *

FROM company_info

LIMIT 1

`,

[],

(err,company)=>{


if(err || !company){

doc.fontSize(20)
.text(
"SARL IDEAIL ROUVETMON",
{
align:"center"
}
);


doc.moveDown();

callback();

return;

}



let logoPath=null;



if(company.logo){


const possiblePath = path.join(

__dirname,

"..",

"uploads",

company.logo

);



if(fs.existsSync(possiblePath)){

logoPath=possiblePath;

}


}




if(logoPath){


doc.image(

logoPath,

{

fit:[100,100],

align:"center"

}

);


doc.moveDown();


}




doc.fontSize(20)

.text(

company.company_name ||

"SARL IDEAIL ROUVETMON",

{

align:"center"

}

);



doc.fontSize(10);



if(company.phone)

doc.text(

`Tel: ${company.phone}`,

{

align:"center"

}

);



if(company.address)

doc.text(

company.address,

{

align:"center"

}

);



doc.moveDown(2);



callback();



});


}







// =======================================
// INVOICE PDF
// =======================================


router.get("/invoice/:id",(req,res)=>{


const invoiceId=req.params.id;



db.get(

`

SELECT

invoices.*,

clients.name AS client_name,

clients.phone AS client_phone,

clients.address AS client_address,

projects.name AS project_name


FROM invoices


LEFT JOIN clients

ON invoices.client_id = clients.id


LEFT JOIN projects

ON invoices.project_id = projects.id


WHERE invoices.id=?

`,

[invoiceId],


(err,invoice)=>{


if(err){

return res.status(500).json({
error:err.message
});

}



if(!invoice){

return res.status(404).json({

error:"الفاتورة غير موجودة"

});

}





const doc=new PDFDocument({

size:"A4",

margin:50

});



res.setHeader(

"Content-Type",

"application/pdf"

);



res.setHeader(

"Content-Disposition",

`inline; filename=invoice-${invoice.id}.pdf`

);



doc.pipe(res);





addCompanyHeader(doc,()=>{



doc.fontSize(16)

.text(

"FACTURE / INVOICE",

{

align:"center"

}

);



doc.moveDown();



doc.fontSize(12);



doc.text(

`رقم الفاتورة: ${invoice.invoice_number}`

);



doc.text(

`التاريخ: ${invoice.invoice_date || ""}`

);



doc.moveDown();



doc.text(

`العميل: ${invoice.client_name || "-"}`

);



doc.text(

`الهاتف: ${invoice.client_phone || "-"}`

);



doc.text(

`العنوان: ${invoice.client_address || "-"}`

);



doc.moveDown();



doc.text(

`المشروع: ${invoice.project_name || "-"}`

);



doc.moveDown();



doc.fontSize(14)

.text(

"تفاصيل الفاتورة"

);



doc.moveDown();



doc.fontSize(12)

.text(

`

المبلغ الإجمالي:

${invoice.amount || 0} DA


الحالة:

${invoice.status || ""}

`

);



doc.moveDown(2);



doc.text(

"شكراً لاختياركم IDEAIL"

);



doc.text(

"التوقيع: " +

(invoice.signature || "")

);



doc.end();



});



});


});









// =======================================
// DEVIS PDF
// =======================================


router.get("/devis/:id",(req,res)=>{


const projectId=req.params.id;



db.get(

`

SELECT

projects.*,

clients.name AS client_name,

clients.phone AS client_phone,

clients.address AS client_address


FROM projects


LEFT JOIN clients

ON projects.client_id = clients.id


WHERE projects.id=?

`,

[projectId],


(err,project)=>{


if(err){

return res.status(500).json({

error:err.message

});

}



if(!project){

return res.status(404).json({

error:"المشروع غير موجود"

});

}





const doc=new PDFDocument({

size:"A4",

margin:50

});



res.setHeader(

"Content-Type",

"application/pdf"

);



res.setHeader(

"Content-Disposition",

`inline; filename=devis-${project.id}.pdf`

);



doc.pipe(res);




addCompanyHeader(doc,()=>{



doc.fontSize(16)

.text(

"DEVIS / عرض سعر",

{

align:"center"

}

);



doc.moveDown();



doc.fontSize(12);



doc.text(

`العميل: ${project.client_name || "-"}`

);



doc.text(

`الهاتف: ${project.client_phone || "-"}`

);



doc.text(

`العنوان: ${project.client_address || "-"}`

);



doc.moveDown();



doc.text(

`المشروع: ${project.name}`

);



doc.text(

`المساحة: ${project.surface_m2 || 0} m²`

);



doc.moveDown();



doc.text(

`المبلغ المقترح: ${project.amount || 0} DA`

);



doc.moveDown(2);



doc.text(

"هذا العرض صالح بعد موافقة العميل."

);



doc.end();



});



});


});





module.exports = router;