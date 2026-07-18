const express = require("express");
const router = express.Router();
const db = require("../database");
const upload = require("../upload");


// ==========================
// GET COMPANY INFO
// ==========================

router.get("/", (req, res) => {

    db.get(
        "SELECT * FROM company_info LIMIT 1",
        [],
        (err, row) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json(row || {});

        }
    );

});



// ==========================
// SAVE COMPANY INFO + LOGO
// ==========================

router.post(
    "/",
    upload.single("logo"),
    (req, res) => {


        const body = req.body || {};


        const {

            company_name,
            phone,
            email,
            address,
            rc,
            nif,
            nis

        } = body;



        const logo = req.file
            ? req.file.filename
            : null;



        db.get(

            "SELECT * FROM company_info LIMIT 1",

            [],

            (err, row) => {


                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }



                // UPDATE EXISTING COMPANY

                if (row) {


                    const finalLogo =
                        logo || row.logo || null;



                    db.run(

                        `
                        UPDATE company_info SET

                        company_name=?,
                        phone=?,
                        email=?,
                        address=?,
                        rc=?,
                        nif=?,
                        nis=?,
                        logo=?

                        WHERE id=?

                        `,

                        [

                            company_name,
                            phone,
                            email,
                            address,
                            rc,
                            nif,
                            nis,
                            finalLogo,
                            row.id

                        ],

                        function(err) {


                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }


                            res.json({

                                success: true,

                                message:
                                "تم تحديث معلومات الشركة"

                            });


                        }

                    );



                }



                // CREATE COMPANY

                else {


                    db.run(

                        `
                        INSERT INTO company_info

                        (

                        company_name,
                        phone,
                        email,
                        address,
                        rc,
                        nif,
                        nis,
                        logo

                        )

                        VALUES (?,?,?,?,?,?,?,?)

                        `,


                        [

                            company_name,
                            phone,
                            email,
                            address,
                            rc,
                            nif,
                            nis,
                            logo

                        ],


                        function(err) {


                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }


                            res.json({

                                success:true,

                                id:this.lastID

                            });


                        }

                    );


                }


            }

        );


    }

);



module.exports = router;
router.get("/test", (req, res) => {
    db.all("SELECT * FROM company_info", [], (err, rows) => {
        if (err) return res.json(err);
        res.json(rows);
    });
});