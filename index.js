exports.handler = async (event) => {
  console.log("server started");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Server started" }),
  };
};
