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
              
               // --> 48 is the limit for bar chart - Issue : was the ' in one of the country names
               //for (i = 1; count < 47; i++) {
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
    console.log(req.params.selected_country);
    fs.readFile(path.join(template_dir, 'country_template.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT Gasses.country, Gasses.year, Gasses.co2, Gasses.cumulative_co2 FROM Gasses';
        //db.all(query, [parseFloat(req.params.selected_year)], (err, rows) => {
        db.all(query, (err, rows) => {
            console.log(err);
            console.log(rows);

            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            }

            else if (rows.length == 0){
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR data not found for country ' + cid.toUpperCase());
                res.end();
            }
            
            else {
                let response = template.toString();
                response = response.replace('%%COUNTRY%%', rows[0].cid);

                let location_table = '';
                let i;

                for(i=0; i < rows.length; i++){
                    country_table = country_table + '<tr><td>' + rows[i].cid + '</td?';
                    country_table = country_table + '<tr><td>' + rows[i].country_name + '</td?';

                }

                response = response.replace('%%COUNTRY_CODES%%', country_table);
                res.status(200).type('html').send(response); // <-- you may need to change this
            }

        });
       
    });
});

// lizzie's work on income level

app.get('/emissions/:income', (req, res) => {
    fs.readFile(path.join(template_dir, 'income_template.html'), (err, template) => {
        let query = 'SELECT Gasses.country, Gasses.country_code, Gasses.year, Gasses.co2, Gasses.cumulative_co2 FROM Gasses';
        
        db.all(query, (err, rows) => {
            console.log(req.params.income);
            
            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            } else {

                let response = template.toString();
                let name = '';
                if(req.params.income == 'upper') {
                    name = 'Upper-middle-income countries';
                } else if(req.params.income=='low') {
                    name = 'Low-income countries';
                } else if(req.params.income == 'lower') {
                    name = 'Lower-middle-income countries';
                } else {
                    name = 'High-income countries';
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
                        console.log(labels);
                        count++;
                        i++;
                    }
                }

                
                response = response.replace('%%YEAR%%', labels);
                response = response.replace("'%%COUNTRY_DATA%%'",  country_data);
                //response = response.replace('%%PREVIOUS%%', parseInt(req.params.selected_year) - parseInt(1)); //previous button
               // response = response.replace('%%NEXT%%', parseInt(req.params.selected_year) + parseInt(1)); //next button
                res.status(200).type('html').send(response);
            }
        });
    });
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
