var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

// var db = require("./models");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = 3000;
var app = express();
var exphbs = require("express-handlebars");

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongo-scraper");

// Routes

//GET requests to render Handlebars pages
// app.get("/", function(req, res) {
//   Article.find({"saved": false}, function(error, data) {
//     var hbsObject = {
//       article: data
//     };
//     console.log(hbsObject);
//     res.render("home", hbsObject);
//   });
// });

// app.get("/saved", function(req, res) {
//   Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
//     var hbsObject = {
//       article: articles
//     };
//     res.render("saved", hbsObject);
//   });
// });
// A GET request to scrape the wjs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.wsj.com/").then( function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the title and summary of every link, and save them as properties of the result object
      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");
console.log(result);
      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
        res.send("Scrape Complete");

  });

});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});