// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');

// Chart.js
const Chart = require('chart.js');

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'greenhouse_gas.sqlite3'); // <-- change this

let app = express();
let port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to desired route)
app.get('/', (req, res) => {
    let home = '/home.html'; // <-- change this *** FIX THIS
    res.redirect(home);
});

// GET request handler for home.html
app.get('/home.html', (req, res) => {
    fs.readFile('home.html', (err, template) => {
        res.status(200).type('html').send(template); 
    });
});

// // Example GET request handler for data about a specific year
// app.get('/year/:selected_year', (req, res) => {
//     console.log(req.params.selected_year);
//     fs.readFile(path.join(template_dir, 'year.html'), (err, template) => {
//         // modify `template` and send response
//         // this will require a query to the SQL database

//         res.status(200).type('html').send(template); // <-- you may need to change this
//     });
// });


// GET request handler for CO2 levels of all countries in specified year - Maddie
app.get('/year/:selected_year', (req, res) => {

    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'levels_in_year_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT Gasses.country_code, Gasses.year, Gasses.co2, Gasses.cumulative_co2 FROM Gasses';
        //db.all(query, [parseFloat(req.params.selected_year)], (err, rows) => {
        db.all(query, (err, rows) => {
            console.log(err);
            //console.log(rows);

            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            } else {
               let response = template.toString();
               
               //The replace for the title - year
               response = response.replace('%%YEAR%%', req.params.selected_year);
               

               let count = 0;
               //let country_table = '';
               let labels = '';
               let country_data = '';

               for (i = 0; i < rows.length; i++) {

                // skip country combined by income rows
                while(rows[i].country_code == 'HIC' || rows[i].country_code == 'UMC' || rows[i].country_code == 'LOC' || rows[i].country_code == 'LMC'){
                    i++;
                }

                if (req.params.selected_year == rows[i].year) {

                    // just here to see if the right information is print - check values__________
                    
            //        country_table = country_table + '<tr><td>' + rows[i].country_code + '</td>';
            //        country_table = country_table + '<td>' + rows[i].cumulative_co2 + '</td></tr>';
                    // ___________________________________________________________________________

                    //This is the part that replaces the script in chart.js
                    // __________________________________________________________
                    //  This is syntax for labels for the graph in chart.js works 
                    //  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    //  in the HTML file looks like --> const labels = ['%%COUNTRIES%%'];

                     
                    //  the closing brackets are already in the code as well as the surrounding ' ' so 
                    //  after the first row for country names are printed out

                    //  and first row for the data
                    //  And syntax for data looks like this --> data: [12, 19, 3, 5, 2, 3],
                    //  in the HTML file looks like --> data: ['%%COUNTRY_DATA%%'],
                    //  similar but dont want the single quotes ' ' (because floats not words) surrounding it so have to replace those too 
                    //  by wrapping the replace in double quotes where --HERE-- is below

                    if (count == 0) {
                        labels = labels + rows[i].country_code;
                        country_data = country_data + rows[i].cumulative_co2;
                    } else {
                    
                        // then after first row print out the rest
                        labels =labels +  "', '" + rows[i].country_code;
                        country_data = country_data +   ", " + rows[i].cumulative_co2;
                    } 
                    count++;
                
                    // __________________________________________________________
                }  

               }
            
               if(count == 0) {
                res.write('ERROR: no data for ' + req.params.selected_year);
                res.end();
                return
               }

               response = response.replace('%%COUNTRIES%%',  labels);
               response = response.replace("'%%COUNTRY_DATA%%'",  country_data);  // <--- HERE ------------------------> !!!
               //response = response.replace('%%DATA%%', country_table);
               response = response.replace('%%PREVIOUS%%', parseInt(req.params.selected_year) - parseInt(1)); //previous button
               response = response.replace('%%NEXT%%', parseInt(req.params.selected_year) + parseInt(1)); //next button
               //console.log(labels);
               //console.log(country_data);
               res.status(200).type('html').send(response); // <-- you may need to change this
            }

        });
       
    });
});

//Carynn country route
app.get('/country/:selected_country', (req, res) => {
   // console.log(req.params.selected_country);
    let cid = req.params.selected_country.toUpperCase();
    fs.readFile(path.join(template_dir, 'country_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        var done = false;
        let prevIdx;
        let nextIdx;
        let response = template.toString();
        let query = 'SELECT Gasses.country_code as selected_country, Gasses.country, Gasses.year, Gasses.co2, Gasses.cumulative_co2 FROM Gasses WHERE Gasses.country_code = ?';
        //db.all(query, [parseFloat(req.params.selected_year)], (err, rows) => {
        db.all(query, [cid], (err, rows) => {
           // console.log(err);
           // console.log(rows);

            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            }

            else if (rows.length == 0){
                //res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR data not found for country ' + cid.toUpperCase());
                res.end();
                return
            }
            
    
                
                response = response.replace('%%COUNTRY%%', rows[0].country);
               // response = response.replace('%%COUNTRY%%', rows[0].country);

            

                /* for(i=0; i < rows.length; i++){
                    //country_table = country_table + '<tr><td>' + rows[i].cid + '</td?';
                    //country_table = country_table + '<tr><td>' + rows[i].country + '</td?';
                    if (i == 0){
                        labels = labels + rows[i].year.toString();
                        country_data = country_data + rows[i].cumulative_co2;
                    } else {
                        labels = labels + "', '" + rows[i].year.toString();
                        country_data = country_data + ", " + rows[i].cumulative_co2;
                    }
                } */

                let country_count = 0;
                let country_labels='';
                let countries_data = '';
                for(i=0; i<rows.length; i++) {
    
                        if (country_count == 0) {
                            country_labels = country_labels + rows[i].year;
                            countries_data = countries_data + rows[i].cumulative_co2;
                        } else {
                            country_labels = country_labels +  "', '" + rows[i].year;
                            countries_data = countries_data +   ", " + rows[i].cumulative_co2;
                        }
                        country_count++;
                        i++;
                    }
                


               // console.log(country_labels);
              //  console.log(countries_data);
               /* let query2 = 'SELECT Gasses.country_code FROM Gasses';
                db.all(query2, [req.params.selected_country], (err, rows2) => {
                    let i = 0;
                    console.log(rows2);
                    console.log("selected_country: "+rows[i].country_code);
                    while(!(req.params.selected_country == rows[i].country_code)&& i < rows.length)
                    {i++

                    };

                    if(i == 0){
                        prevIdx = rows.length - 1;
                        nextIdx = 1;
                    }
                    else if(i == rows.length - 1){
                        prevIdx = i-1;
                        nextIdx = 0;
                    }
                    else{
                        prevIdx = i-1;
                        nextIdx = i+1;
                    }

                    if(done){
                        response = response.replace('%%PREVIOUS%%', rows[prevIdx].country_code);
                        response = response.replace('%%NEXT%%', rows[nextIdx].country_code);
                        //res.status(200).type('html').send(response);
                    }
                    done = true;
                });*/
                

                console.log(country_labels);
                        console.log(countries_data);

                //response = response.replace('%%COUNTRY_CODES%%', country_table);
                response = response.replace('%%COUNTRY_DATA%%', countries_data);
                response = response.replace('%%COUNTRIES%%', country_labels);
                res.status(200).type('html').send(response); // <-- you may need to change this

        });
       
    });
});

// lizzie's work on income level

app.get('/emissions/:income', (req, res) => {
    fs.readFile(path.join(template_dir, 'income_template.html'), (err, template) => {
        let query = 'SELECT Gasses.country, Gasses.country_code, Gasses.year, Gasses.co2, Gasses.cumulative_co2 FROM Gasses';
        
        db.all(query, (err, rows) => {
            
            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            } else {

                let response = template.toString();
                let name = '';
                let value;
                if(req.params.income == 'upper' || req.params.income == '3') {
                    name = 'Upper-middle-income countries';
                    value = 3;
                } else if(req.params.income=='low' || req.params.income == '1' || req.params.income=='5') {
                    name = 'Low-income countries';
                    value = 1;
                } else if(req.params.income == 'lower' || req.params.income == '2') {
                    name = 'Lower-middle-income countries';
                    value = 2;
                } else if(req.params.income == 'high' || req.params.income=='4' || req.params.income=='0') {
                    name = 'High-income countries';
                    value = 4;
                } else {
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.write('ERROR: Emissions based on ' + req.params.income + ' income level was not found');
                    res.end();
                    return
                }
                response = response.replace('%%INCOME_LEVEL%%', name);
                
                let count = 0;
                let labels='';
                let country_data = '';
                for(i=0; i<rows.length; i++) {
                    while(rows[i].country == name) {
                        if (count == 0) {
                            labels = labels + rows[i].year;
                            country_data = country_data + rows[i].cumulative_co2;
                        } else {
                            labels =labels +  "', '" + rows[i].year;
                            country_data = country_data +   ", " + rows[i].cumulative_co2;
                        }
                        count++;
                        i++;
                    }
                }

                response = response.replace('%%YEAR%%', labels);
                response = response.replace("'%%COUNTRY_DATA%%'",  country_data);
                response = response.replace('%%PREVIOUS%%', parseInt(value) - parseInt(1)); //previous button
                response = response.replace('%%NEXT%%', parseInt(value) + parseInt(1)); //next button
                res.status(200).type('html').send(response);
            }
        });
    });
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
