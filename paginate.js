// including require packages for scraping data
// requiring apify puppeteer module
const PuppeteerLaunch = require('apify').launchPuppeteer;

// this is used to process each call asynchronously
const async = require('async');

// requiring fs node module to write data to a file
const fs = require("fs");

// initial url (page 1)
const coreURL = "https://www.visithoustontexas.com/events/";

var finalLinks = [];

// creating an async function, for completing the process of scraping before it returns the data to where this function called from
let scrape = async (url) => {

    // Actual Scraping goes Here
    // url from where data need to be fetched
    // launching puppeeteer module before we can use it, headless false is referring to headless browser (only content of browser is gonna be visible)
    // with headless: false, you can actually watch browser work as it navigates through your code
    const browser = await PuppeteerLaunch({headless: false});

    // open a new page in headless browser state
    const page = await browser.newPage();

    // navigate to url and wait until whole page loads
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    // wait until events heading and all events are loaded on page
    await page.waitFor('.eventsContainer .catHeading', {timeout: 200000});

    // evaluate the page dom and all the elements exists on that page
    const result = await page.evaluate(() => {

        // select references of all the events on page
        const events = document.querySelectorAll('.eventItem');

        // array to store 5 event links of 1 page
        let eventLinks = [];
        if(events) {
            events.forEach((event, index) => {

                // only storing 5 links from every page, if you want all links from a page then remove this if condition
                if(index < 5) {
                    eventLinks.push("https://www.visithoustontexas.com" + event.querySelector('a').getAttribute('href'));
                }  
            });
        }
        // returning 5 events links of 1 page
        return eventLinks
    
    });

    // close the browser the return the result
    browser.close();
    return result;
};

/**
 * Calling scrape function to process scraping and finally receiving the data
 */
function getLinks(url, callback) {

    // it is calling scrape function to fetch the event links of 1 page, url variable is refering to 1 page only
    scrape(url).then((data) => {

        // return the data being sent from scrape function
        callback(data);
    });
}

// array to store an instance of scrape function for each link of pagination to process scrapping
var asyncTasks = [];

// array to store the links of each page
var urls = [];

// storing urls of 7 pages
for(var i = 0; i<7; i++) {
    urls.push(coreURL + "?page="+(i+2));
}
// iterating an array to store reference of callback function to handle scrapping of each function
urls.forEach(function (link, index) {
    // We don't actually execute the async action here
    // We add a function containing it to an array of "tasks"
    asyncTasks.push(function (callback) {

        // Calling my async function
        getLinks(link, function (response) {
            
            // Async call is done, alert via callback
            if (response) {
                callback(null, response);
            } else {
                callback("error", null);
            }
        });
    });
});

// Now we have an array of functions doing async tasks
// Execute all async tasks in the asyncTasks array
async.parallel(asyncTasks, function (err, result) {
    if (err) {
        console.log("Error in opening link(s).");
        return;
    }           
    console.log("Links are fetched.")
    // if there is no error
    // in below code, I am formatting data to be stored in json file
    
    result.forEach((linkArray, index) => {
        linkArray.forEach((link, idx) => {
            finalLinks.push(link);
        });
    });

    // using fs module for file handling, this is where I am writing the data in utf8 format and after converting it into stringify
    // if we don't convert it, it will saved at [Object, Object] in eventData.json file
    fs.writeFileSync('pagesLinks.json', JSON.stringify(finalLinks), 'utf8', function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
});


