import axios from 'axios';

const timestamps = [
  { tokenSymbol: 'ETH', timeStamp: new Date('2022-10-17T04:58:35.000Z') },
];

interface PriceResponse {
  USD: number;
}

async function getPriceFromCryptoCompare(
  tokenSymbol: string,
  timestamp: Date,
): Promise<number> {
  const unixTimestamp = Math.floor(timestamp.getTime() / 1000);
  const url = `https://min-api.cryptocompare.com/data/pricehistorical?fsym=${tokenSymbol}&tsyms=USD&ts=${unixTimestamp}`;

  try {
    const response = await axios.get<{ [key: string]: PriceResponse }>(url);
    return response.data[tokenSymbol].USD;
  } catch (error) {
    console.error(
      `Error fetching price for ${tokenSymbol} at ${timestamp.toISOString()}:`,
      error,
    );
    throw error;
  }
}

async function getDifficultPrices() {
  const prices = await Promise.all(
    timestamps.map(async ({ tokenSymbol, timeStamp }) => {
      const price = await getPriceFromCryptoCompare(tokenSymbol, timeStamp);
      return {
        tokenSymbol,
        timeStamp,
        price,
      };
    }),
  );

  console.log(JSON.stringify(prices, null, 2));
  return prices;
}

getDifficultPrices().catch(console.error);
