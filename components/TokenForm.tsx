
import React, { useState, useMemo, useCallback, ChangeEvent, FormEvent } from "react";
import { ethers, ContractFactory, BrowserProvider, Contract } from "ethers";
import { TOKEN_ABI, TOKEN_BYTECODE } from '../constants/contractConstants';
import { TokenFormValues, Distribution, DeploymentStatus } from '../types';
import { WalletIcon, CheckCircleIcon, XCircleIcon, PlusIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon, UploadCloudIcon, ExternalLinkIcon } from './icons';
import LoadingSpinner from "./LoadingSpinner";

// Define InputField component outside of TokenForm to prevent re-creation on every render.
interface InputFieldProps {
  name: keyof TokenFormValues | string; // Allow generic string for distribution fields
  placeholder: string;
  type?: string;
  required?: boolean;
  className?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  step?: string;
  id?: string; // Optional id prop
}

const InputField: React.FC<InputFieldProps> = ({ name, id, placeholder, type = "text", required = false, className = "", value, onChange, step }) => (
  <div className="relative">
    <input
      id={id || (name as string)} // Use provided id or fallback to name
      name={name as string}
      placeholder={placeholder}
      type={type}
      required={required}
      value={value as string}
      onChange={onChange}
      className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder-gray-400 text-white ${className}`}
      aria-label={placeholder}
      step={step}
    />
  </div>
);


const TokenForm: React.FC = () => {
  const initialFormValues = useMemo<TokenFormValues>(() => ({
    name: "",
    symbol: "",
    supply: "",
    decimals: "18",
    description: "",
    url: "",
    mintable: false,
    image: null,
  }), []);

  const [formValues, setFormValues] = useState<TokenFormValues>(initialFormValues);
  const [distributions, setDistributions] = useState<Distribution[]>([{ address: "", amount: "" }]);
  const [network, setNetwork] = useState<string>("mumbai");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const isSandbox = useMemo(() => {
    try {
      return typeof window !== "undefined" && typeof window.ethereum === "undefined";
    } catch {
      return true;
    }
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "image/png") {
        setFormValues((prev) => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
        setDeploymentStatus(null);
      } else {
        setDeploymentStatus({ type: 'error', message: '画像はPNG形式である必要があります。' });
        setImagePreview(null);
        e.target.value = ''; // Reset file input
      }
    }
  }, []);

  const handleDistributionChange = useCallback((index: number, field: keyof Distribution, value: string) => {
    setDistributions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addDistributionRow = useCallback(() => {
    setDistributions((prev) => [...prev, { address: "", amount: "" }]);
  }, []);

  const removeDistributionRow = useCallback((index: number) => {
    setDistributions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const connectWallet = useCallback(async () => {
    if (isSandbox) {
      setDeploymentStatus({ type: 'info', message: "このプレビュー環境ではウォレット接続できません。サンドボックスモードを使用します。" });
      setWalletAddress("sandbox-wallet-address");
      return;
    }
    if (window.ethereum) {
      setIsLoading(true);
      setDeploymentStatus(null);
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setDeploymentStatus({ type: 'success', message: `ウォレットに接続されました: ${accounts[0].substring(0,6)}...${accounts[0].substring(accounts[0].length-4)}` });
        } else {
          setDeploymentStatus({ type: 'error', message: "ウォレットアカウントが見つかりませんでした。" });
        }
      } catch (err: any) {
        console.error("ウォレット接続エラー", err);
        setDeploymentStatus({ type: 'error', message: err.message || "ウォレット接続に失敗しました。" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setDeploymentStatus({ type: 'error', message: "MetaMaskがインストールされていません。インストールしてから再度お試しください。" });
    }
  }, [isSandbox]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!walletAddress && !isSandbox) {
      setDeploymentStatus({ type: 'error', message: "トークンを発行する前にウォレットを接続してください。" });
      return;
    }
    if (!agreedToTerms) {
      setDeploymentStatus({ type: 'error', message: "利用規約に同意してください。" });
      return;
    }

    setIsLoading(true);
    setDeploymentStatus(null);

    if (isNaN(parseFloat(formValues.supply)) || parseFloat(formValues.supply) <= 0) {
        setDeploymentStatus({ type: 'error', message: "総発行量は有効な正の数値である必要があります。" });
        setIsLoading(false);
        return;
    }
    if (isNaN(parseInt(formValues.decimals)) || parseInt(formValues.decimals) < 0 || parseInt(formValues.decimals) > 18) {
        setDeploymentStatus({ type: 'error', message: "小数点以下の桁数は0から18の間の有効な整数である必要があります。" });
        setIsLoading(false);
        return;
    }
    for (const dist of distributions) {
        if (dist.address || dist.amount) {
            if (!ethers.isAddress(dist.address)) {
                setDeploymentStatus({ type: 'error', message: `無効な配布先アドレス: ${dist.address}` });
                setIsLoading(false);
                return;
            }
            if (isNaN(parseFloat(dist.amount)) || parseFloat(dist.amount) <= 0) {
                setDeploymentStatus({ type: 'error', message: `配布数量は有効な正の数値である必要があります。アドレス: ${dist.address}` });
                setIsLoading(false);
                return;
            }
        }
    }

    if (isSandbox) {
      console.log("送信データ (sandbox):", {
        ...formValues,
        image: formValues.image ? formValues.image.name : null,
        distributions,
        network,
        walletAddress: "sandbox-wallet-address",
      });
      setTimeout(() => {
        setDeploymentStatus({ type: 'success', message: "トークンがサンドボックスモードで「発行」されました。", contractAddress: "0xSandboxDeployedContractAddress" });
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask が見つかりません。");
      }
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const currentNetwork = await provider.getNetwork();
      const targetChainId = network === "polygon" ? 137n : 80001n; 

      let finalSigner = signer;

      if (currentNetwork.chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.toQuantity(targetChainId) }],
          });
           // After switching, re-initialize provider and signer
          const newProvider = new BrowserProvider(window.ethereum);
          finalSigner = await newProvider.getSigner();
          const newNetwork = await newProvider.getNetwork();
          if (newNetwork.chainId !== targetChainId) {
             throw new Error(`MetaMaskが正しいネットワーク (${network}) に接続されていません。`);
          }
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            const networkDetails = network === "polygon" ? 
              { chainId: ethers.toQuantity(137n), chainName: 'Polygon Mainnet', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com/'], blockExplorerUrls: ['https://polygonscan.com/'] } :
              { chainId: ethers.toQuantity(80001n), chainName: 'Mumbai Testnet', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://rpc-mumbai.maticvigil.com/'], blockExplorerUrls: ['https://mumbai.polygonscan.com/'] };
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkDetails],
              });
              // After adding, re-initialize provider and signer
              const newProviderAfterAdd = new BrowserProvider(window.ethereum);
              finalSigner = await newProviderAfterAdd.getSigner();
              const newNetworkAfterAdd = await newProviderAfterAdd.getNetwork();
              if (newNetworkAfterAdd.chainId !== targetChainId) {
                 throw new Error(`MetaMaskが正しいネットワーク (${network}) に接続されていません。`);
              }
            } catch (addError) {
              throw new Error(`選択したネットワーク (${network}) への切り替え/追加に失敗しました。MetaMaskで手動で切り替えてください。`);
            }
          } else {
            throw new Error(`選択したネットワーク (${network}) への切り替えに失敗しました。MetaMaskで手動で切り替えてください。`);
          }
        }
      }
      
      const TokenFactory = new ContractFactory(TOKEN_ABI, TOKEN_BYTECODE, finalSigner);
      const contract = await TokenFactory.deploy(
        formValues.name,
        formValues.symbol,
        ethers.parseUnits(formValues.supply, parseInt(formValues.decimals))
      );
      
      const deployedContract: Contract = await contract.waitForDeployment();
      const contractAddress = await deployedContract.getAddress();
      
      setDeploymentStatus({ type: 'success', message: `トークンが正常に発行されました！ネットワーク: ${network}`, contractAddress: contractAddress });

    } catch (err: any) {
      console.error("発行エラー", err);
      let message = "トークンの発行中にエラーが発生しました。"
      if (err.message) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      // Check for common user-rejected transaction error
      if (err.code === 4001 || (err.message && err.message.includes("User rejected the request"))) {
        message = "トランザクションがユーザーによって拒否されました。";
      }
      setDeploymentStatus({ type: 'error', message: message });
    } finally {
      setIsLoading(false);
    }
  }, [formValues, distributions, network, walletAddress, agreedToTerms, isSandbox]);


  return (
    <div className="w-full max-w-2xl bg-slate-800 shadow-2xl rounded-xl p-6 md:p-10 my-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
          💡 トークン発行フォーム
        </h1>
        <p className="text-slate-400">あなただけのオリジナルガバナンストークンを簡単に発行しよう！</p>
      </div>

      {deploymentStatus && (
        <div className={`p-4 mb-6 rounded-md text-sm flex items-start space-x-3
          ${deploymentStatus.type === 'success' ? 'bg-green-700/30 text-green-300 border border-green-500' : ''}
          ${deploymentStatus.type === 'error' ? 'bg-red-700/30 text-red-300 border border-red-500' : ''}
          ${deploymentStatus.type === 'info' ? 'bg-blue-700/30 text-blue-300 border border-blue-500' : ''}
        `}>
          {deploymentStatus.type === 'success' && <CheckCircleIcon className="w-5 h-5 mt-0.5 text-green-400" />}
          {deploymentStatus.type === 'error' && <XCircleIcon className="w-5 h-5 mt-0.5 text-red-400" />}
          {deploymentStatus.type === 'info' && <InfoIcon className="w-5 h-5 mt-0.5 text-blue-400" />}
          <div>
            <p className="font-semibold">{deploymentStatus.message}</p>
            {deploymentStatus.contractAddress && deploymentStatus.type === 'success' && (
              <a
                href={
                  network === "polygon"
                  ? `https://polygonscan.com/address/${deploymentStatus.contractAddress}`
                  : `https://mumbai.polygonscan.com/address/${deploymentStatus.contractAddress}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline inline-flex items-center"
              >
                コントラクトを確認 <ExternalLinkIcon className="w-4 h-4 ml-1" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        {walletAddress ? (
          <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded-md border border-slate-600">
            <WalletIcon className="w-6 h-6 text-purple-400" />
            <span className="text-green-400 font-semibold">接続済: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-md font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-purple-400/50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && walletAddress === null ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <WalletIcon className="w-5 h-5 mr-2" />}
            ウォレットを接続する
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField name="name" placeholder="トークン名 (例: My Awesome Token)" required value={formValues.name} onChange={handleInputChange} />
        <InputField name="symbol" placeholder="シンボル (例: MAT)" required value={formValues.symbol} onChange={handleInputChange} />
        <InputField name="supply" placeholder="総発行量 (例: 1000000)" type="number" required value={formValues.supply} onChange={handleInputChange} step="any" />
        <InputField name="decimals" placeholder="小数点 (例: 18)" type="number" value={formValues.decimals} onChange={handleInputChange} />

        <div>
          <label htmlFor="image-upload-input" className="block mb-2 text-sm font-medium text-slate-300">🖼 トークン画像 (PNGのみ)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md hover:border-purple-500 transition-colors">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Token Preview" className="mx-auto h-24 w-24 object-cover rounded-full mb-2"/>
              ) : (
                <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-500" />
              )}
              <div className="flex text-sm text-slate-500">
                <label htmlFor="image-upload-input" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-purple-500 px-2 py-1">
                  <span>ファイルをアップロード</span>
                  <input id="image-upload-input" name="image" type="file" accept="image/png" className="sr-only" onChange={handleImageChange} />
                </label>
                <p className="pl-1">またはドラッグ＆ドロップ</p>
              </div>
              <p className="text-xs text-slate-500">PNG形式 最大5MB</p>
            </div>
          </div>
           {formValues.image && <p className="text-xs text-slate-400 mt-1">選択中のファイル: {formValues.image.name}</p>}
        </div>

        <textarea name="description" placeholder="トークンの説明文 (オプション)" className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder-gray-400 text-white min-h-[100px]" value={formValues.description} onChange={handleInputChange} />
        <InputField name="url" placeholder="関連URL (例: https://mytoken.com)" type="url" value={formValues.url} onChange={handleInputChange} />

        <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-md">
          <input id="mintable" type="checkbox" name="mintable" checked={formValues.mintable} onChange={handleInputChange} className="h-5 w-5 text-purple-500 bg-slate-600 border-slate-500 rounded focus:ring-purple-600 focus:ring-offset-slate-800 cursor-pointer" />
          <label htmlFor="mintable" className="text-sm font-medium text-slate-300 cursor-pointer select-none">追加発行を許可する (コントラクトにmint関数が実装されている場合)</label>
        </div>
        
        <div className="border-t border-slate-700 pt-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-3">📋 初期配布先 (オプション)</h2>
          {distributions.map((dist, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3 items-center">
              <InputField id={`dist_address_${idx}`} name={`dist_address_${idx}`} placeholder="ウォレットアドレス (例: 0x...)" value={dist.address} onChange={(e) => handleDistributionChange(idx, "address", e.target.value)} className="flex-1"/>
              <InputField id={`dist_amount_${idx}`} name={`dist_amount_${idx}`} placeholder="配布数量" type="number" value={dist.amount} onChange={(e) => handleDistributionChange(idx, "amount", e.target.value)} className="sm:w-40" step="any"/>
              {distributions.length > 1 && (
                 <button type="button" onClick={() => removeDistributionRow(idx)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                    <XCircleIcon className="w-5 h-5" />
                  </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addDistributionRow} className="flex items-center text-purple-400 text-sm hover:text-purple-300 transition-colors font-medium py-2">
            <PlusIcon className="w-5 h-5 mr-1" /> 行を追加する
          </button>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <label className="text-xl font-semibold text-slate-200 mb-3 block">🔗 ネットワーク選択</label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="flex items-center p-3 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600 transition-colors has-[:checked]:bg-purple-600 has-[:checked]:ring-2 has-[:checked]:ring-purple-400">
              <input type="radio" name="network" value="mumbai" checked={network === "mumbai"} onChange={() => setNetwork("mumbai")} className="form-radio h-4 w-4 text-purple-500 bg-slate-600 border-slate-500 focus:ring-purple-600 mr-2 sr-only" />
              <span className="text-sm font-medium text-slate-300">Mumbai (テストネット)</span>
            </label>
            <label className="flex items-center p-3 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600 transition-colors has-[:checked]:bg-purple-600 has-[:checked]:ring-2 has-[:checked]:ring-purple-400">
              <input type="radio" name="network" value="polygon" checked={network === "polygon"} onChange={() => setNetwork("polygon")} className="form-radio h-4 w-4 text-purple-500 bg-slate-600 border-slate-500 focus:ring-purple-600 mr-2 sr-only" />
              <span className="text-sm font-medium text-slate-300">Polygon (本番)</span>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-slate-200">🛡️ 利用規約</h2>
            <button type="button" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center" onClick={() => setShowTerms(!showTerms)}>
              {showTerms ? "閉じる" : "読む"}
              {showTerms ? <ChevronUpIcon className="w-5 h-5 ml-1" /> : <ChevronDownIcon className="w-5 h-5 ml-1" />}
            </button>
          </div>
          {showTerms && (
            <div className="mt-4 p-4 border border-slate-600 rounded-md bg-slate-700/50 space-y-3 text-sm text-slate-300">
              <p>このフォームを通じて発行されるトークンは、いかなる金銭的価値も保証されません。資金決済法・金融商品取引法などの規制対象外として提供されています。</p>
              <p>本サービスは応援・記念・非商用目的での利用を前提とし、売買・投資・交換などの金融利用は推奨しません。発行されたトークンの利用は自己責任で行ってください。</p>
              <p>ブロックチェーン取引にはガス代が発生します。発行操作の前に、ウォレットに十分なネイティブ通貨（MATICなど）があることを確認してください。</p>
              <div className="flex items-center mt-4 pt-3 border-t border-slate-600">
                <input type="checkbox" id="agree" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-5 w-5 text-purple-500 bg-slate-600 border-slate-500 rounded focus:ring-purple-600 focus:ring-offset-slate-700 cursor-pointer" />
                <label htmlFor="agree" className="ml-2 text-sm font-medium text-slate-200 cursor-pointer select-none">上記利用規約に同意します</label>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-700">
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-lg font-bold text-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-green-400/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={(!walletAddress && !isSandbox) || !agreedToTerms || isLoading}
          >
            {isLoading ? <LoadingSpinner className="w-6 h-6 mr-3" /> : '🚀'}
            {isLoading ? "発行処理中..." : "トークンを発行する"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TokenForm;
