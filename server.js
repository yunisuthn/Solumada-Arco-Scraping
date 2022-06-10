const express = require ("express");
const app = express();
const path = require ("path")
const fs = require ('fs');
//const {emiter} = require('./event/EventEmmiter');
const {fetchData,restartBrowser} = require ('./scpraping/mockScrapper');
const sleep = require("./scpraping/helper");


// const userName = process.env.USER
// (()=>console.log(' username :'+userName))()


const PORT = process.env.PORT || 8080;

var scapStatus = {
    data : false,
    onScrap : false,
}

var data = {
    rows : []
}

// start the browser
async function handleBrowser(){
    console.log("[browser] first init, onScrap == true")
    scapStatus.onScrap = true
    await restartBrowser()
    scapStatus.onScrap = false
    console.log("[browser] first Browser ready, onScrap == false")
    
    setInterval(async()=>{      // auto restart browser
        if(scapStatus.onScrap===false){
            scapStatus.onScrap = true
            console.log(">>> Restarting browser ... scraStatusOn")
            await restartBrowser()
                .then(()=>{
                    scapStatus.onScrap = false
                    console.log(">>> Browser ok, scrap status off")
                })
        }
        else{
            await waitForScrap(scapStatus)
        }
        
    },900000)
}


async function waitForScrap(scapStatus){       // wait scraping to be done
    (function listen(){
        setTimeout(
            ()=>{
                if(scapStatus.status===true) listen
                else return
            }
        ,2000)
    })
}

async function handleScraping(req,res,status){
    if (status.onScrap===false){   // no scraping on, so start it
        status.onScrap = true;
            console.log('Scrap on')                              
        
        let data = await fetchData()   
            console.log('Scrap end')

        return data
    }
    if (status.onScrap===true){         // wait for scraping to be done
        await waitForScrap(scapStatus)
        await sleep(10000)
        return data.rows
    }
    else
        res.send('ERROR : handling event scrap && data')  
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/',  (req, res)=>{
    if(data.rows.length>0)
        res.render('data', {rows : data.rows})
    else
        res.render('index')
});

app.get('/data',async (req,res)=>{
    data.rows = await handleScraping(req,res,scapStatus)
    res.render('data', {rows :  data.rows})
        scapStatus.status = false   // okkk simultanee
        scapStatus.onScrap = false
    console.log('Scrap off :: data rendered')
})

app.get('/download', async (req,res)=>{
    await waitForScrap(scapStatus)
    try {res.download('./public/assets/batch.xls');}
    catch (e){console.log('Download error ::'+e)}
 })

const server = app.listen(process.env.PORT || PORT, async() => {
    const port = server.address().port;
    await handleBrowser()
    console.log(`Express is working on port ${port}`);
});


// node.js version with stable puppeeter

// Lambda runtime Node.js 14.x
// Puppeteer-core version 10.1.0
