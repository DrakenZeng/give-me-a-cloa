<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jDo80LNEmC8pn49Z4LYhDlf6kSeeoNkz

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Bridge (Sepolia → Base Sepolia)

Route: `/bridge`

Optional env vars (`frontend/.env.local`):

```bash
NEXT_PUBLIC_SEPOLIA_GATEWAY_ADDRESS=0x0c487a766110c85d301d96e33579c5b317fa4995
NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS=0x...
NEXT_PUBLIC_TARGET_ZRC20_BASE_SEPOLIA=0x...
```

## Demo Tip（写死：Sepolia 0.005 ETH → Base Sepolia EOA）

右侧 “VendingMachine” 会发起固定参数的跨链打赏：
- 源链：Ethereum Sepolia
- 金额：0.005 ETH
- 目标链：Base Sepolia
- 收款：固定 EOA（写死）

需要在 `frontend/.env.local` 设置：

```bash
NEXT_PUBLIC_DEMO_RECIPIENT_BASE_SEPOLIA=0x...
NEXT_PUBLIC_UNIVERSAL_SWAP_APP_ADDRESS=0x...
NEXT_PUBLIC_TARGET_ZRC20_BASE_SEPOLIA=0x...
```
