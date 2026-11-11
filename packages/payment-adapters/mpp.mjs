// Deliberately resolve MPP and its viem peer inside the independently locked package.
export {Mppx as MppClient,evm as clientEvm} from 'mppx/client';
export {Mppx as MppServer,evm as serverEvm} from 'mppx/server';
