export const gatewayEvmAbi = [
  {
    type: 'function',
    name: 'depositAndCall',
    stateMutability: 'payable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'payload', type: 'bytes' },
      {
        name: 'revertOptions',
        type: 'tuple',
        components: [
          { name: 'revertAddress', type: 'address' },
          { name: 'callOnRevert', type: 'bool' },
          { name: 'abortAddress', type: 'address' },
          { name: 'revertMessage', type: 'bytes' },
          { name: 'onRevertGasLimit', type: 'uint256' },
        ],
      },
    ],
    outputs: [],
  },
] as const;

