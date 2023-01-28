const express = require("express");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { config } = require("dotenv");
config();
// Configurar la conexión a S3
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

//const s3 = new aws.S3();

// Configurar Multer para subir archivos a S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + file.originalname);
    },
  }),
});

// Iniciar la aplicación de Express
const app = express();

// Ruta para subir archivos
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    url: req.file.location,
  });
});

// Ruta para obtener la URL de un archivo
app.get("/file/:fileName", (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: req.params.fileName,
  };
  s3.getSignedUrl("getObject", params, (err, url) => {
    if (err) {
      res.status(400).json({
        error: "No se pudo obtener la URL del archivo",
      });
    } else {
      res.json({
        url: url,
      });
    }
  });
});

app.listen(3000, () => {
  console.log("Servidor iniciado en el puerto 3000");
});
