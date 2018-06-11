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
app.get("/", function(req, res) {
  Article.find({"saved": false}, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});
// A GET request to scrape the wjs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.wsj.com/").then( function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $(".wsj-card").each(function(i, element) {
      // console.log("working!");
      // Save an empty result object
      var result = {};

      // Add the title and summary of every link, and save them as properties of the result object
      result.title = $(this).children(".wsj-headline").text();
      result.summary = $(this).children(".wsj-card-body").children(".wsj-summary").children("span").text();
      result.link = $(this).children("h3").children("a").attr("href");
      // console.log(result);

      Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
     
    });
        res.send("Scrape Complete");

  });

});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port" + PORT + "!");
});