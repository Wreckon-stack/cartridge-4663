# Reference

## `abi/`

Verified contract ABIs, fetched from Blockscout for the exact addresses this project
reads. They are kept in the repo so the minimal fragments in `src/data/abi.ts` can be
checked against the real thing without a network round trip.

| File | Address | Verified source name |
|---|---|---|
| `factory.abi.json` | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` | `PonsV2LaunchFactory` |
| `hook.abi.json` | `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` | `V2MemeHook` |
| `router.abi.json` | `0xe33E9E479dF8802cb0866d5d05258bEc4cF62948` | `PonsV2LaunchAndBuy` |
| `gme.abi.json` | `0x1b0E319c6A659F002271B69dB8A7df2F911c153E` | `BeaconProxy` → impl `Stock` |

None of these are shipped to the browser. See `docs/PAIRING_VERIFICATION.md`.
