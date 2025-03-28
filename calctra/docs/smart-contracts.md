# Calctra Smart Contracts Guide

This document provides detailed information about the smart contracts used in the Calctra platform, their functionality, and how to interact with them.

## Overview

Calctra's blockchain layer is built on the Solana blockchain, leveraging its high throughput, low fees, and programmable capabilities. Our smart contracts are written in Rust using the Anchor framework, which provides a more ergonomic developer experience for building Solana programs.

The main smart contracts in the Calctra ecosystem include:

1. **CAL Token Contract**: Manages the native utility token of the platform
2. **Resource Matching Contract**: Facilitates the matching of computing resources with jobs
3. **Payment Processing Contract**: Handles escrow, payments, and rewards
4. **Governance Contract**: Enables decentralized decision-making for platform parameters

## Development Environment Setup

To develop or interact with Calctra smart contracts, you'll need the following tools:

1. Install Rust and Cargo:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install Solana CLI tools:
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.14.17/install)"
   ```

3. Install Anchor framework:
   ```bash
   npm install -g @project-serum/anchor-cli
   ```

4. Configure Solana for development:
   ```bash
   solana config set --url localhost
   solana-keygen new
   ```

## CAL Token Contract

The CAL token is the native utility token of the Calctra platform, used for payments, staking, and governance.

### Token Specifications

- **Name**: Calctra
- **Symbol**: CAL
- **Decimals**: 9
- **Initial Supply**: 1,000,000,000 (1 billion) tokens
- **Token Standard**: SPL Token (Solana's equivalent of ERC-20)

### Key Functions

#### Initialize Token Mint

Creates the CAL token mint with the specified decimals and authority.

```rust
pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()>
```

#### Mint Tokens

Mints new CAL tokens to a specified account (only callable by mint authority).

```rust
pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()>
```

#### Stake Tokens

Locks tokens as stake for resource providers, acting as collateral.

```rust
pub fn stake_resource(ctx: Context<StakeResource>, amount: u64, resource_id: String) -> Result<()>
```

#### Release Stake

Releases staked tokens back to the resource provider.

```rust
pub fn release_stake(ctx: Context<ReleaseStake>, resource_id: String) -> Result<()>
```

### JavaScript Integration

Example of interacting with the CAL token contract using JavaScript:

```javascript
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Initialize connection to Solana
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Load the CAL token program
const programId = new PublicKey('CALTokenProgramIDXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
const program = new anchor.Program(idl, programId, provider);

// Get token balance
async function getTokenBalance(walletAddress) {
  const tokenAccount = await getAssociatedTokenAddress(
    new PublicKey('CALTokenMintAddressXXXXXXXXXXXXXXXXXXXXXXXX'),
    new PublicKey(walletAddress)
  );
  
  const balance = await connection.getTokenAccountBalance(tokenAccount);
  return balance.value.uiAmount;
}
```

## Resource Matching Contract

The Resource Matching Contract facilitates the registration, discovery, and matching of computing resources with computing jobs.

### Key Functions

#### Register Resource

```rust
pub fn register_resource(
    ctx: Context<RegisterResource>,
    resource_id: String,
    name: String,
    description: String,
    specs: ResourceSpecs,
    price_per_unit: u64,
    availability: Availability
) -> Result<()>
```

#### Create Job

```rust
pub fn create_job(
    ctx: Context<CreateJob>,
    job_id: String,
    name: String,
    description: String,
    requirements: JobRequirements,
    budget: u64,
    deadline: i64
) -> Result<()>
```

#### Match Job with Resources

```rust
pub fn match_job_with_resources(
    ctx: Context<MatchJob>,
    job_id: String,
    resource_ids: Vec<String>
) -> Result<()>
```

#### Accept Job

```rust
pub fn accept_job(ctx: Context<AcceptJob>, job_id: String) -> Result<()>
```

#### Complete Job

```rust
pub fn complete_job(ctx: Context<CompleteJob>, job_id: String) -> Result<()>
```

### Data Structures

```rust
#[account]
pub struct ComputeResource {
    pub owner: Pubkey,
    pub resource_id: String,
    pub name: String,
    pub description: String,
    pub specs: ResourceSpecs,
    pub price_per_unit: u64,
    pub availability: Availability,
    pub active: bool,
    pub reputation_score: u16,
    pub total_compute_time: u64,
}

#[account]
pub struct ComputeJob {
    pub owner: Pubkey,
    pub job_id: String,
    pub name: String,
    pub description: String,
    pub requirements: JobRequirements,
    pub budget: u64,
    pub deadline: i64,
    pub status: JobStatus,
    pub matched_resources: Vec<String>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub rating: Option<u8>,
    pub feedback: Option<String>,
}
```

### JavaScript Integration

Example of creating a job using JavaScript:

```javascript
async function createJob(wallet, jobDetails) {
  const tx = await program.methods.createJob(
    jobDetails.jobId,
    jobDetails.name,
    jobDetails.description,
    jobDetails.requirements,
    new anchor.BN(jobDetails.budget),
    new anchor.BN(jobDetails.deadline)
  )
  .accounts({
    owner: wallet.publicKey,
    job: generateJobAddress(jobDetails.jobId),
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([wallet])
  .rpc();
  
  console.log('Job created with transaction signature:', tx);
  return tx;
}
```

## Payment Processing Contract

The Payment Processing Contract handles escrow, payment releases, and reward distributions.

### Key Functions

#### Create Escrow

```rust
pub fn create_escrow(
    ctx: Context<CreateEscrow>,
    job_id: String,
    amount: u64
) -> Result<()>
```

#### Release Payment

```rust
pub fn release_payment(
    ctx: Context<ReleasePayment>,
    job_id: String,
    recipient: Pubkey
) -> Result<()>
```

#### Distribute Rewards

```rust
pub fn distribute_rewards(
    ctx: Context<DistributeRewards>,
    data_id: String,
    recipients: Vec<Pubkey>,
    amounts: Vec<u64>
) -> Result<()>
```

### JavaScript Integration

Example of creating an escrow for a job:

```javascript
async function createJobEscrow(wallet, jobId, amount) {
  const tx = await program.methods.createEscrow(
    jobId,
    new anchor.BN(amount)
  )
  .accounts({
    payer: wallet.publicKey,
    escrowAccount: generateEscrowAddress(jobId),
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([wallet])
  .rpc();
  
  console.log('Escrow created with transaction signature:', tx);
  return tx;
}
```

## Governance Contract

The Governance Contract enables decentralized decision-making for platform parameters.

### Key Functions

#### Create Proposal

```rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
    parameter_key: String,
    parameter_value: Vec<u8>,
    voting_period: i64
) -> Result<()>
```

#### Cast Vote

```rust
pub fn cast_vote(
    ctx: Context<CastVote>,
    proposal_id: u64,
    vote: bool
) -> Result<()>
```

#### Execute Proposal

```rust
pub fn execute_proposal(
    ctx: Context<ExecuteProposal>,
    proposal_id: u64
) -> Result<()>
```

### JavaScript Integration

Example of creating a governance proposal:

```javascript
async function createGovernanceProposal(wallet, proposalDetails) {
  const tx = await program.methods.createProposal(
    proposalDetails.title,
    proposalDetails.description,
    proposalDetails.parameterKey,
    proposalDetails.parameterValue,
    new anchor.BN(proposalDetails.votingPeriod)
  )
  .accounts({
    proposer: wallet.publicKey,
    proposal: anchor.web3.Keypair.generate().publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([wallet])
  .rpc();
  
  console.log('Proposal created with transaction signature:', tx);
  return tx;
}
```

## Deployment

Smart contracts are deployed to the Solana blockchain using the Anchor deployment process.

```bash
# Build the program
anchor build

# Deploy to localhost for testing
anchor deploy --provider.cluster localnet

# Deploy to devnet for testing with real SOL
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta
```

## Testing

We recommend thorough testing of smart contract interactions:

1. Unit tests using Anchor's testing framework
2. Integration tests on a local validator
3. Devnet testing before mainnet deployment

Example test script:

```javascript
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { assert } from 'chai';

describe('cal-token', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CalToken;
  
  it('Initializes the token mint', async () => {
    // Test code here
  });
  
  it('Can mint tokens', async () => {
    // Test code here
  });
  
  // More tests...
});
```

## Security Considerations

When interacting with Calctra smart contracts, keep these security considerations in mind:

1. **Private Key Security**: Protect your private keys and never share them
2. **Transaction Verification**: Always verify transaction details before signing
3. **Program Address Verification**: Verify program addresses to prevent phishing
4. **Update Monitoring**: Stay informed about contract updates and migrations
5. **Gas Management**: Ensure adequate SOL balance for transaction fees

## Future Contract Upgrades

The Calctra protocol will evolve over time. Smart contract upgrades will follow this process:

1. Community proposal through governance
2. Development and auditing of new contract versions
3. Testnet deployment and thorough testing
4. Gradual mainnet rollout with migration period for users

Stay informed about upcoming changes through our official communication channels.

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework Documentation](https://project-serum.github.io/anchor/)
- [Calctra Developer Discord](https://discord.gg/calctra-dev)
- [Solana Program Library (SPL)](https://spl.solana.com/)

## Support

For technical support with smart contract integration, please contact:
- Email: dev-support@calctra.io
- Developer Forum: https://forum.calctra.io/dev 