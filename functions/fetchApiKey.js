exports.handler = async (event, context) => {
  const apiKey1 = process.env.API_KEY_1;
  const apiKey2 = process.env.API_KEY_2;
  const apiKey3 = process.env.API_KEY_3;
  const apiKey4 = process.env.API_KEY_4;

  return {
    statusCode: 200,
    body: JSON.stringify({
      apiKey1,
      apiKey2,
      apiKey3,
      apiKey4,
    }),
  };
};
