const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let registry, owner, verifier, alice, bob;

  beforeEach(async function () {
    [owner, verifier, alice, bob] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    await registry.connect(owner).setVerifier(verifier.address, true);
  });

  it("registers a new property under the caller", async function () {
    await expect(
      registry.connect(alice).registerProperty("LC-1001-AB", "Varanasi, UP", 1200, "bafy-doc-hash-1")
    )
      .to.emit(registry, "PropertyRegistered")
      .withArgs(1, alice.address, "LC-1001-AB", "bafy-doc-hash-1");

    const prop = await registry.getProperty(1);
    expect(prop.owner).to.equal(alice.address);
    expect(prop.status).to.equal(0); // Pending
  });

  it("rejects registration with an empty document hash", async function () {
    await expect(
      registry.connect(alice).registerProperty("LC-1002-AB", "Varanasi, UP", 1200, "")
    ).to.be.revertedWith("LandRegistry: documentHash required");
  });

  it("only an approved verifier can verify a property", async function () {
    await registry.connect(alice).registerProperty("LC-1003-AB", "Varanasi, UP", 900, "hash-2");

    await expect(registry.connect(bob).verifyProperty(1)).to.be.revertedWith(
      "LandRegistry: caller is not an approved verifier"
    );

    await expect(registry.connect(verifier).verifyProperty(1))
      .to.emit(registry, "PropertyVerified")
      .withArgs(1, verifier.address);

    const prop = await registry.getProperty(1);
    expect(prop.status).to.equal(1); // Verified
  });

  it("only the owner of a property can transfer it, and transfer resets status to Pending", async function () {
    await registry.connect(alice).registerProperty("LC-1004-AB", "Varanasi, UP", 1500, "hash-3");
    await registry.connect(verifier).verifyProperty(1);

    await expect(registry.connect(bob).transferProperty(1, bob.address)).to.be.revertedWith(
      "LandRegistry: caller does not own this property"
    );

    await expect(registry.connect(alice).transferProperty(1, bob.address))
      .to.emit(registry, "PropertyOwnershipTransferred")
      .withArgs(1, alice.address, bob.address);

    const prop = await registry.getProperty(1);
    expect(prop.owner).to.equal(bob.address);
    expect(prop.status).to.equal(0); // Pending again after transfer

    const aliceProps = await registry.getPropertiesByOwner(alice.address);
    const bobProps = await registry.getPropertiesByOwner(bob.address);
    expect(aliceProps.length).to.equal(0);
    expect(bobProps.length).to.equal(1);
  });

  it("lets the property owner resubmit a new document hash after rejection", async function () {
    await registry.connect(alice).registerProperty("LC-1005-AB", "Varanasi, UP", 800, "hash-4");
    await registry.connect(verifier).rejectProperty(1, "Survey mismatch");

    let prop = await registry.getProperty(1);
    expect(prop.status).to.equal(2); // Rejected

    await registry.connect(alice).updateDocumentHash(1, "hash-4-revised");
    prop = await registry.getProperty(1);
    expect(prop.documentHash).to.equal("hash-4-revised");
    expect(prop.status).to.equal(0); // Pending
  });

  it("only the contract owner can add or remove verifiers", async function () {
    await expect(registry.connect(alice).setVerifier(bob.address, true)).to.be.revertedWithCustomError(
      registry,
      "OwnableUnauthorizedAccount"
    );
  });
});
