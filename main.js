// including packages for scraping data and storing in a variable
// requiring apify puppeteer module
const PuppeteerLaunch = require('apify').launchPuppeteer;

// requiring fs node module for writing data to a file
const fs = require("fs");


// creating an async function, getting the data from web page and storing it into variables
let scrape = async () => {

    // url of the web page stored in a variable
    const url = 'https://www.visithoustontexas.com/event/zumba-in-the-plaza/59011/';

    // launching puppeeteer module before using it, headless false is referring to headless browser (only content of browser will be visible)
    // with headless: false, you can watch browser work as it navigates through your code / without user interface
    const browser = await PuppeteerLaunch({headless: false});

    // open a new page in headless browser state
    const page = await browser.newPage();

    // navigate to url and wait until whole page loads
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    // evaluate the page dom and all the elements exists on that page
    const result = await page.evaluate(() => {

        // using query selector to select title of event (using class names)
        const description = document.querySelector('.detail-top .detail-c2 h1').innerText;

        // using query selector to select both dates of event (using class names). will separate dates later using array index
        const dates = document.querySelectorAll('.detail-top .detail-c2 .dates');

        // select the address and split if by space, so we can use street, city, state and postal code separately
        const address = document.querySelector('.detail-top .detail-c2 .adrs').innerText.split(' ');

        // select all the divs that include time, contact, phone and admission
        const divs = document.querySelectorAll('.detail-top .detail-c2 div');

        // create the whole object
        return {
            "url": 'https://www.visithoustontexas.com/event/zumba-in-the-plaza/59011/',
            "description": description, // this is mainly the title on web page
            "date": dates[0].innerHTML, // 0 means first date element, at 1 index, there is recurring
            "time": divs[6].innerHTML.substring(divs[6].innerHTML.lastIndexOf('>') + 1), // exclude time key, which was in strong tag
            "recurring": dates[1].innerHTML, // 1 means second recurring element, at 0 index, there is time
            "place": { // creating the place object using address variable
                "street": address[0],
                "city": address[1] + ' ' + address[2],
                "state": address[4] + ' ' + address[5],
                "postal": address[6] + ' ' + address[7]
            },
            "details": {
                "contact": divs[4].innerHTML.substring(divs[4].innerHTML.lastIndexOf('>') + 1), // exclude contact key, which was in strong tag
                "phone": divs[5].innerHTML.substring(divs[5].innerHTML.lastIndexOf('>') + 1), // exclude phone key, which was in strong tag
                "admission": divs[7].innerHTML.substring(divs[6].innerHTML.lastIndexOf('>') + 1) // exclude admission key, which was in strong tag
            },
            "timestamp": divs[6].innerHTML.substring(divs[6].innerHTML.lastIndexOf('>') + 1) // exclude time key, which was in strong tag
        };
    });

    // close the browser and return the result
    browser.close();
    return result;
};


//Calling scrape function to process scraping and finally received the data
 
scrape().then((data) => {
    // simply log the data to verify the result
    console.log(data); 
    // using fs module for file handling, writing the data in utf8 format then converting it into stringify
    // if you don't convert it, it will save as an [Object, Object] in eventData.json file
    fs.writeFile('eventData.json', JSON.stringify(data), 'utf8', function (err) {
        if (err) throw err;
        console.log('\n Saved!');
    });
});

   



