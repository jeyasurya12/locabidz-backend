const EMAIL_TEMPLATE = `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title> TEMPLATE_HEADER </title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
          }
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              padding-bottom:10px;
          }
          .email-footer {
            max-width: 600px;
            background-color: #ffffff;
            padding-top: 10px;
        }
          .button {
              background-color: #24003D;
              padding: 10px 20px;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
          }
          .regards {
              margin-top: 10px;
          }
          .fontstyle {
              font-size: 12px; 
              font-family: "Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
          .headerStyle {
              font-size: 2rem; 
              font-family: "Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
          .inboxWarpMain .inbox-data-content .inbox-data-content-intro {
              text-align: center;
              display: flex;
              justify-content: center;
          }
          a{
            color: #24003D !important;
          }
      </style>  
      </head>
         <body>
            <p style="margin: 6px 0 16px 0">
              TEMPLATE_CONTENT
            </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

module.exports = { EMAIL_TEMPLATE };
