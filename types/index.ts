
export interface TokenFormValues {
  name: string;
  symbol: string;
  supply: string;
  decimals: string;
  description: string;
  url: string;
  mintable: boolean;
  image: File | null;
}

export interface Distribution {
  address: string;
  amount: string;
}

export type DeploymentStatusType = 'success' | 'error' | 'info';

export interface DeploymentStatus {
  type: DeploymentStatusType;
  message: string;
  contractAddress?: string;
}
