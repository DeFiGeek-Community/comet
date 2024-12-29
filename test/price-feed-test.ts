import { ethers, expect, makeProtocol } from './helpers';

describe('getPrice', function () {
  it('returns price data for assets, with 8 decimals', async () => {
    const { comet, priceFeeds } = await makeProtocol({
      assets: {
        USDC: {},
        COMP: {
          initial: 1e7,
          decimals: 18,
          initialPrice: 1.2345,
        },
      },
    });

    const price = await comet.getPrice(priceFeeds.COMP.address);

    expect(price.toNumber()).to.equal(123450000);
  });

  it('reverts if given a bad priceFeed address', async () => {
    const { comet } = await makeProtocol();

    // COMP on mainnet (not a legit price feed address)
    const invalidPriceFeedAddress = '0xc00e94cb662c3520282e6f5717214004a7f26888';

    await expect(comet.getPrice(invalidPriceFeedAddress)).to.be.reverted;
  });

  it('reverts if price feed returns negative value', async () => {
    const { comet, priceFeeds } = await makeProtocol({
      assets: {
        USDC: {},
        COMP: {
          initial: 1e7,
          decimals: 18,
          initialPrice: -1,
        },
      },
    });

    await expect(comet.getPrice(priceFeeds.COMP.address)).to.be.revertedWith("custom error 'BadPrice()'");
  });
});

// forking from mainnet
describe('UniTwapChainlinkPriceFeed', function () {
  it('returns price data for assets, with 8 decimals', async () => {
    const configuration = [
      '0x08bfa2Ba3c948A35AD9d9f2746A51Ffaf796A814', // uniswapPool
      '0x5FFF1443Cb859E17e9a6786f7e24c369F22FD002', // uniswapUnderlying(PND)
      '0x961dD84059505D59f82cE4fb87D3c09bec65301d', // uniswapBase(TXJP)
      '0x7354FbF446fFF15Db6C7c2B8A4a84bFc092B6485', // priceFeedChainlink(TXJP/USD)
      8,                                            // decimals
      'PND/USD priceFeed'                        // description
    ];
    const PriceFeedFactory = (await ethers.getContractFactory('UniTwapChainlinkPriceFeed'));
    const priceFeed = await PriceFeedFactory.deploy(...configuration);

    const uniswapPrice = await priceFeed.uniswapPrice();
    console.log(uniswapPrice);
    expect(uniswapPrice.toNumber()).to.not.equal(0);

    const pndPrice = await priceFeed.latestRoundData();
    console.log(pndPrice);
    expect(pndPrice[1].toNumber()).to.not.equal(0);
  });
});