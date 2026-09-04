import { createPublicClient, http, formatUnits } from 'viem'
import fs from 'node:fs'

const RPC = process.env.RPC_URL ?? 'https://rpc.mainnet.chain.robinhood.com'
const client = createPublicClient({ transport: http(RPC, { retryCount: 5, retryDelay: 1500 }) })
const factoryAbi = JSON.parse(fs.readFileSync(new URL('../reference/abi/factory.abi.json', import.meta.url)))

const FACTORY = '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e'
const GME     = '0x1b0E319c6A659F002271B69dB8A7df2F911c153E'
const WETH    = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73'
const USDG    = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168'

const read = (functionName, args = []) => client.readContract({ address: FACTORY, abi: factoryAbi, functionName, args })

console.log('chainId              =', await client.getChainId())
console.log('factory.owner()      =', await read('owner'))
console.log('factory.memeHook()   =', await read('memeHook'))
console.log('factory.poolManager()=', await read('poolManager'))
console.log('factory.locker()     =', await read('locker'))
console.log('factory.launchEnabled() =', await read('launchEnabled'))
console.log('factory.launchConfigCount() =', await read('launchConfigCount'))
console.log('factory.launchFee()  =', (await read('launchFee')).toString())

for (const [label, addr] of [['GME', GME], ['WETH', WETH], ['USDG', USDG]]) {
  const approved = await read('approvedPairTokens', [addr])
  const [phantomQuote, graduationThreshold, decimals] = await read('pairTokenEconomics', [addr])
  console.log(`\npairToken ${label} ${addr}`)
  console.log(`  approvedPairTokens   = ${approved}`)
  console.log(`  phantomQuote         = ${phantomQuote} (${formatUnits(phantomQuote, decimals)} ${label})`)
  console.log(`  graduationThreshold  = ${graduationThreshold} (${formatUnits(graduationThreshold, decimals)} ${label})`)
  console.log(`  decimals             = ${decimals}`)
}
