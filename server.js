const express = require('express')
const bodyParser = require('body-parser')

const multer = require('multer')
const path = require('path')
const fs = require('fs')
const mongodb = require('mongodb')
const app = express()

//use the middleware of body parser
app.use(bodyParser.urlencoded({ extended: true }))

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },

    //name attribute of index.html file ==fieldname myfile myImage 
    //jpeg mp4 png
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})


var upload = multer({
    storage: storage
})

//congfiguring mongodb
const mongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017'


mongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}, (err, client) => {
    if (err) console.log(err)

    db = client.db('Images')

    app.listen(3000, () => {
        console.log('mongo db at 3000')
    })
})
//configuring the port

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

//configuring the upload file
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        const error = new Error("Please upload a file")
        error.httpStatusCode = 400;
        return next(error)
    }
    res.send(file)
})

//upload multiple files at a timd
app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
    const files = req.files;
    if (!files) {
        const error = new Error("Please upload a file")
        error.httpStatusCode = 400;
        return next(error)
    }
    res.send(files)
})

//configuring the image upload to the database

app.post('/uploadphoto', upload.single('myImage'), (req, res, next) => {
    var img = fs.readFileSync(req.file.path);

    var encode_img = img.toString('base64');

    //define a json object for an image
    var finalImage = {
        contentTpe: req.file.mimetype,
        path: req.file.path,
        image: new Buffer(encode_img, 'base64')
    }

    //insert the image to db
    db.collection('image').insertOne(finalImage, (err, result) => {
        console.log(result)
        if (err) return console.log(err)

        console.log('saved to db')

        res.contentType(finalImage.contentTpe)
        res.send(finalImage.image)
    })
})

app.listen(5000, () => {
    console.log('server started')
})