
const http = require("http");

const server = http.createServer((req, res) => {
  // Route 1: Return the current time as JSON
  if (req.method === "GET" && req.url === "/time") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        time: new Date().toString(),
      })
    );
  }

  // Route 2: Display an HTML page with a button to fetch the time
  else if (req.method === "GET" && req.url === "/timePage") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });

    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Current Time</title>
        </head>
        <body>
          <h1>Clock</h1>
          <button id="getTimeBtn">Get Current Time</button>
          <p id="time"></p>

          <script>
            document
              .getElementById("getTimeBtn")
              .addEventListener("click", async () => {
                try {
                  const response = await fetch("/time");
                  const data = await response.json();

                  document.getElementById("time").textContent = data.time;
                } catch (error) {
                  document.getElementById("time").textContent =
                    "Unable to retrieve the current time.";
                }
              });
          </script>
        </body>
      </html>
    `);
  }

  // Route 3: Receive JSON and return it inside weReceived
  else if (req.method === "POST" && req.url === "/echo") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            weReceived: parsedBody,
          })
        );
      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Invalid JSON in request body",
          })
        );
      }
    });
  }

  // Handle unknown routes
  else {
    res.writeHead(404, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Not Found",
      })
    );
  }
});

server.listen(8000, () => {
  console.log("Server is running at http://localhost:8000");
});
