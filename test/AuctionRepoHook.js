const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionRepoHook", function () {
  // Define variables to be used throughout the tests
  let auctionRepoHook;
  let poolManager;
  let worldId;
  let quoteToken;
  let collateralToken;
  let owner;
  let lender;
  let borrower;
  let addrs;

  // Constants
  const initialLTV = 7000; // 70%
  const liquidationThreshold = 8500; // 85%
  const maturityTimestamp = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days
  
  // Mock values for WorldID
  const mockSignal = ethers.ZeroAddress;
  const mockRoot = 1;
  const mockNullifierHash = 1234567890;
  const mockProof = [1, 2, 3, 4, 5, 6, 7, 8];

  beforeEach(async function () {
    // Get signers
    [owner, lender, borrower, ...addrs] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    quoteToken = await MockERC20.deploy("Quote Token", "QUOT", 6);
    await quoteToken.waitForDeployment();
    
    collateralToken = await MockERC20.deploy("Collateral Token", "COLL", 18);
    await collateralToken.waitForDeployment();

    // Deploy mock WorldID
    const MockWorldID = await ethers.getContractFactory("MockWorldID");
    worldId = await MockWorldID.deploy();
    await worldId.waitForDeployment();

    // Deploy mock PoolManager
    const MockPoolManager = await ethers.getContractFactory("MockPoolManager");
    poolManager = await MockPoolManager.deploy();
    await poolManager.waitForDeployment();

    // Deploy AuctionRepoHook
    const AuctionRepoHook = await ethers.getContractFactory("AuctionRepoHook");
    auctionRepoHook = await AuctionRepoHook.deploy(
      await poolManager.getAddress(),
      await worldId.getAddress(),
      await quoteToken.getAddress(),
      owner.address
    );
    await auctionRepoHook.waitForDeployment();

    // Setup token allowances
    await collateralToken.mint(borrower.address, ethers.parseEther("100"));
    await quoteToken.mint(lender.address, ethers.parseEther("10000"));
    
    await collateralToken.connect(borrower).approve(await auctionRepoHook.getAddress(), ethers.MaxUint256);
    await quoteToken.connect(lender).approve(await auctionRepoHook.getAddress(), ethers.MaxUint256);
    
    // Add collateral to allowed list
    await auctionRepoHook.setCollateralAllowed(await collateralToken.getAddress(), true);
    
    // Create market with 90-day maturity
    await auctionRepoHook.addMarket(maturityTimestamp);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await auctionRepoHook.owner()).to.equal(owner.address);
    });

    it("Should store correct token addresses", async function () {
      expect(await auctionRepoHook.quoteToken()).to.equal(await quoteToken.getAddress());
      expect(await auctionRepoHook.worldIdRouter()).to.equal(await worldId.getAddress());
    });

    it("Should initialize with correct LTV parameters", async function () {
      expect(await auctionRepoHook.initialLTV()).to.equal(initialLTV);
      expect(await auctionRepoHook.liquidationThreshold()).to.equal(liquidationThreshold);
    });
  });

  // Add more test blocks as needed
});