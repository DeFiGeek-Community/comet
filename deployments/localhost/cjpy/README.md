# About

Script to set up a CJPY market with a simple configuration on localhost.

# Usage

- Run `yarn hardhat node`.
- Run `yarn hardhat deploy --network localhost --deployment cjpy --no-verify --no-verify-impl` with another cli.

If you want to deploy again, you need to restart the node and delete `roots.json`.

The `--verbose` option can be used to output a trace.
