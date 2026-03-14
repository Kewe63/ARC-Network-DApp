# ARC Network DApp

ARC Network için geliştirilmiş bir Decentralized Application (DApp). Bu uygulama, ArcToken akıllı kontratını Ethereum ağında deploy etmek, yönetmek ve etkileşimde bulunmak için tasarlanmıştır.

## Özellikler

- **Wallet Bağlantısı**: MetaMask veya diğer Web3 cüzdanlarını bağlayın
- **Kontrat Deployment**: ArcToken akıllı kontratını ağa deploy edin
- **Token Etkileşimi**: Token mint, transfer ve diğer işlemler
- **Transaction Geçmişi**: Tüm işlemlerinizi takip edin
- **Gerçek Zamanlı Güncellemeler**: Blok numarası ve kontrat olaylarını izleyin
- **Çok Dilli Destek**: İngilizce ve Türkçe arayüz
- **Matrix Rain Efekti**: Görsel efektlerle modern bir deneyim

## Teknolojiler

- **Frontend**: React 19, Vite
- **Blockchain**: Ethereum, Solidity
- **Web3**: Ethers.js v6
- **Compiler**: Solc (Solidity Compiler)
- **Styling**: CSS Modules
- **Linting**: ESLint

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/Kewe63/ARC-Network-DApp.git
   cd arc
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda `http://localhost:5173` adresine gidin.

## Kullanım

1. Web3 cüzdanınızı (örneğin MetaMask) bağlayın
2. Ağ seçin (mainnet, testnet, vb.)
3. ArcToken kontratını deploy edin
4. Token işlemlerini gerçekleştirin
5. Transaction geçmişini görüntüleyin

## Build

Üretim için build almak için:
```bash
npm run build
```

## Lint

Kod kalitesini kontrol etmek için:
```bash
npm run lint
```

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız için GitHub Issues kullanın.
