import { formatUnits } from 'viem';

export interface FormattedTokenState {
  unit: 'token'; tokenDecimals: 6; nativeDecimals: 18;
  balances: Record<string,string>; allowances: Record<string,string>; reserves: Record<string,string>;
  shares?: string; vaultAssets?: string;
}

/** A convenience view of the same block-bound integers, never replacement evidence. */
export function formatTokenState(state: {
  balances?: Record<string,string>; allowances?: Record<string,string>; reserves?: Record<string,string>;
  shares?: string; vaultAssets?: string;
}): FormattedTokenState {
  const fields = (values:Record<string,string> = {}, native = false) => Object.fromEntries(
    Object.entries(values).filter(([,value]) => typeof value === 'string' && /^\d+$/.test(value))
      .map(([key,value]) => [key,formatUnits(BigInt(value),native && key === 'native' ? 18 : 6)]),
  );
  return {unit:'token',tokenDecimals:6,nativeDecimals:18,
    balances:fields(state.balances,true),allowances:fields(state.allowances),reserves:fields(state.reserves),
    ...(state.shares !== undefined && /^\d+$/.test(state.shares) ? {shares:formatUnits(BigInt(state.shares),6)} : {}),
    ...(state.vaultAssets !== undefined && /^\d+$/.test(state.vaultAssets) ? {vaultAssets:formatUnits(BigInt(state.vaultAssets),6)} : {}),
  };
}
