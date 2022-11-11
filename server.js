// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');

// Chart.js
//const Chart = require('chart.js');
//const myChart = new Chart(ctx, {...});


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
    let home = '/emissions/high'; // <-- change this *** FIX THIS
    res.redirect(home);
});


// Example GET request handler for data about a specific year
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});



//GET request handler for CO2 levels of all countries in specified year - Maddie
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'levels_in_year_template.html'), (err, template) => {
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
            } else {
                let response = template.toString();
                response = response.replace('%%YEAR%%', req.params.selected_year);
                
                
                
                res.status(200).type('html').send(response); // <-- you may need to change this
            }

        });
       
    });
});



// lizzie's work on income level

app.get('/emissions/:income', (req, res) => {
    fs.readFile(path.join(template_dir, 'income_template.html'), (err, template) => {
        let query = 'SELECT Gasses.country as income, Gasses.year, \
        Gasses.co2, Gasses.cumulative_co2 FROM Gasses WHERE Gasses.income = ?';
        let income = req.params.income;
        /*if(input=='high') {
            let income = 'High-income countries';
        } else if(input=='low') {
            let income = 'Low-income countries';
        } else if(input == 'lower' || input == 'middle') {
            let income = 'Lower-middle-income countries';
        } else {
            let income = 'Upper-middle-income countries';
        }*/
        db.all(query, [income], (err, rows) => {
            if(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.write('ERROR file not found');
                res.end();
            } else {
                let response = template.toString();
                response = response.replace('%%INCOME_LEVEL%%', rows[0].income);

                let cereal_table = '';
                let i;
                for(i=0; i<rows.length; i++) {
                    cereal_table = cereal_table + '<tr><td>' + rows[i].year + '</td>';
                    cereal_table = cereal_table + '<td>' + rows[i].co2 + '</td>';
                    cereal_table = cereal_table + '<td>' + rows[i].cumulative_co2 + '</td></tr>';
                }
                response = response.replace('%%EMISSION_INFO%%', cereal_table);

                res.status(200).type('html').send(response);
            }
        });
    });
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
