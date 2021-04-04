const Shopify = require("shopify-api-node");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const cron = require("node-cron");
let date_now1 = new Date();
let date_now = new Date(date_now1.setHours(date_now1.getHours() - 6));
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const webhookURL =
  "<creadantials>";
const fs = require("fs");
const readline = require("readline");
const { google, admin_directory_v1 } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "token.json";
const shopify1 = new Shopify({
  shopName: "store",
  apiKey: "",
  password: "",
  autoLimit: true,
  bucketSize: { calls: 1, interval: 5000, bucketSize: 35 },
  apiVersion: "2021-01",
});

const shopify2 = new Shopify({
  shopName: "store",
  apiKey: "",
  password: "",
  autoLimit: true,
  bucketSize: { calls: 1, interval: 5000, bucketSize: 35 },
  apiVersion: "2021-01",
});


function authorize(credentials, callback, coupon2) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    return callback(oAuth2Client, coupon2);
  });
}



function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
  
  
  
  let skus = [];

async function listMajors(auth, coupon2) {
  const sheets = google.sheets({ version: "v4", auth });
  const files = await axios.get('').catch(err=>console.log(err))
  Promise.all([files]).then(async(all_skuss) =>{
    if(all_skuss){
   console.log('Files', all_skuss[0].data)

  let my_files = all_skuss[0].data;
  let sku2 = [];
  try {
  
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: "",
      range: "",
    });

    const rows = res.data.values;

    if (rows.length) {
      rows.map((row) => {
        sku2.push(row[0]);
      });
      const functionWithPromise = async (sku) => {
        //a function that returns a promise
        if (sku) {
          let pr_id = 0
            my_files.map(files=>{
              files.variants.map(x =>{
                if(x.sku === sku){
                  pr_id = x.product_id;
                  console.log('pr_id', pr_id)
                }
              })
            })

            if (pr_id !== 0) {
              let product = await shopify1.product.get(pr_id).catch((err) => {
                console.log(err);
              });
              //console.log('PRR', product)
              if (product) {
                let variant = product.variants.filter(
                  (variant) => variant.sku === sku
                );
                if (variant.length > 0) {
                  let var_id = variant[0].id;
                  let new_tags = product.tags + `,${coupon2}-${var_id}`;
                  let update_pr = await shopify1.product
                    .update(pr_id, { tags: new_tags })
                    .catch((err) => {
                      console.log(err);
                    });
                  console.log("UPDATE:", update_pr.id);
                  if (update_pr) {
                    return Promise.resolve(sku);
                  } else {
                    return Promise.resolve(
                      `<b><font color=\"#ff0000\">Error:</font> for sku=${sku}, server error</font></b>`
                    );
                  }
                } else {
                  return Promise.resolve(
                    `<b><font color=\"#ff0000\">Error:</font> for sku=${sku}, can't find product by id</font></b>`
                  );
                }
              } else {
                return Promise.resolve(
                  `<b><font color=\"#ff0000\">Error:</font> for sku=${sku}, can't find product by id</b>`
                );
              }
            } else {
              return Promise.resolve(
                `<b><font color=\"#ff0000\">Error:</font> for sku=${sku}, can't find product by id</b>`
              );
            }
        } else {
          return Promise.resolve(
            `<b><font color=\"#ff0000\">Error:</font> sku can not be an empty space</b>`
          );
        }
      };
      const anAsyncFunction = async (item) => {
        return functionWithPromise(item);
      };
      const getData = async () => {
        return Promise.all(sku2.map((item) => anAsyncFunction(item)));
      };

      getData().then((data) => {
        console.log("FINISH");
        if (data === undefined) {
          error_mess = `<b><font color=\"#3bad3f\">Server error appears during an attempt to add SS-tags</font></b>`;
          const data5 = JSON.stringify({
            cards: [
              {
                header: {
                  title: ,
                  subtitle: '',
                  imageUrl:
                    "",
                  imageStyle: "AVATAR",
                },
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: error_mess,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          });

          fetch(webhookURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
            },
            body: data5,
          })
            .then((res) => res.json())
            .then((json) => console.log(json));

          return;
        }
        console.log("ALL DATA", data);
        let valid_a = 0;
        data = data.filter((x, i) => {
          if (x.includes("Error:")) return x;
          else valid_a++
          data.push(`<b>Have been proceeded: ${valid_a} skus</b>`);
        });
        if (data.length == 0) {
          data.push(
            `<center><h1><b><font color=\"#3bad3f\">All SS-tags have been successfully added!</font></b><h1></center>`
          );
        } else {
          data = data.map((x, i) => `<b>${i + 1}.</b> ${x}`);
          if (data.length > 100) {
            console.log("More than 10");
            data = data.slice(0, 100);
            data.push(`<b>...More...</b>`);
          }
        }

        let data2 = data.join("\n");
        const data3 = JSON.stringify({
          cards: [
            {
              header: {
                title: '',
                subtitle: "Active sale, adding tags...",
                imageUrl:
                  "",
                imageStyle: "AVATAR",
              },
              sections: [
                {
                  widgets: [
                    {
                      textParagraph: {
                        text: data2,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        });
        fetch(webhookURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: data3,
        })
          .then((res) => res.json())
          .then((json) => console.log(json));

        console.log(data);
        if (data.length == sku2.slice(0, 2).length) {
          console.log("Length", data.length);
        }
        console.log("Finish");
      });
    } else {
      console.log("No data found.");
    }
  } catch (err) {
    console.log("The API returned an error: " + err);
  }
}
else{
  console.log('Upload failed')
  const data7 = JSON.stringify({
    cards: [
      {
        header: {
          title: '',
          subtitle: "Active sale, adding tags...",
          imageUrl:
            "",
          imageStyle: "AVATAR",
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `Error occured trying to upload products files from the server`,
                },
              },
            ],
          },
        ],
      },
    ],
  });
  fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: data7,
  })
    .then((res) => res.json())
    .then((json) => console.log(json));

}


})
}
