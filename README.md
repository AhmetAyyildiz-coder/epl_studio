# EPL Studio

React tabanli bir EPL etiket tasarim aracidir. Surukle-birak editor ile etiket bileşenleri yerleştirilir, veri alanlariyla baglanir, EPL cikti uretilir ve ayni tasarim React/HTML sablonu olarak saklanabilir.

Bu proje, hem baski odakli bir etiket editoru hem de farkli React uygulamalarinda tekrar kullanilabilecek template ureticisi gibi calisir.

## Neler Yapabilir?

- Metin, siyah kutu, barkod, cizgi ve kutu elemanlariyla etiket tasarlama
- Surukle-birak onizleme ile yerlesim duzenleme
- JSON veri kaynagini etiket alanlarina baglama
- EPL cikti uretme ve elle duzenleyip tekrar preview'a uygulama
- Barkod onizlemesini React tarafinda gercege yakin simule etme
- Template'i iki formatta saklama:
  - sablon_icerik: editorun element modeli
  - sablon_react_icerik: farkli React uygulamalarinda kullanilabilecek sade HTML/React template
- Backend'e etiket metaverisi gonderme:
  - DPI
  - etiket genisligi ve yuksekligi
  - X ve Y baski offset degerleri

## Ekran Mantigi

Editor uc ana alanda calisir:

- Sol panel: taslak secimi ve JSON veri girisi
- Orta alan: etiket onizlemesi, EPL cikti ve React/HTML sablonu
- Sag panel: arac kutusu ve secili eleman ozellikleri

Bu yapi sayesinde hem baski odakli bir duzenleme akisi hem de entegrasyon odakli template cikarma akisi ayni ekranda yonetilir.

## Teknoloji Yigini

- React 19
- TypeScript
- Vite
- Material UI
- react-rnd
- react-barcode

## Gelistirme Ortami

### Gereksinimler

- Node.js 18+
- npm 9+
- Calisan bir backend API

### Kurulum

```bash
npm install
```

### Gelistirme Sunucusu

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Build Onizleme

```bash
npm run preview
```

## Backend Entegrasyonu

Frontend tarafinda etiket sablonu servis adresi su dosyada tanimlidir:

[src/services/etiketSablonuService.ts](src/services/etiketSablonuService.ts)

Varsayilan API adresi:

```txt
http://localhost:5105/api/common/etiket-sablonu
```

Kaydetme ve guncelleme isteklerinde su alanlar backend'e gonderilir:

- kisaKod
- sablonAdi
- sablonIcerik
- sablonReactIcerik
- dpi
- labelWidthMm
- labelHeightMm
- offsetXDot
- offsetYDot

## Template Saklama Mantigi

Projede ayni etiket iki farkli temsil ile tutulur.

### 1. Editor modeli

Bu alan editorun dogrudan tekrar acilabilmesi icin gereklidir.

```json
{
  "version": 1,
  "elements": []
}
```

Bu veri sablon_icerik kolonunda tutulur.

### 2. React / HTML template modeli

Bu alan farkli uygulamalarda tekrar render edilebilecek sade bir template'tir. MUI siniflari veya gecici DOM yerine, stabil data attribute'lar kullanir.

Ornek:

```html
<div data-epl-template="true">
  <div data-epl-type="text" data-binding="karakterKod" data-placeholder="{{karakterKod}}"></div>
  <epl-barcode data-epl-type="barcode" data-binding="isEmriId" data-value="{{isEmriId}}"></epl-barcode>
</div>
```

Bu veri sablon_react_icerik kolonunda tutulur.

## Placeholder Yapisi

Dinamik alanlar template icinde gorunur icerik yerine attribute olarak saklanir:

```txt
data-placeholder="{{alan_adi}}"
```

Ornekler:

- data-placeholder="{{karakterKod}}"
- data-placeholder="{{musteri}}"
- data-value="{{isEmriId}}"

Bu yapi sayesinde template ham haliyle acildiginda tasarim bozulmaz; veri baglama bilgisi de kaybolmadan farkli uygulamalarda kolayca parse edilip doldurulabilir.

## Barkod Modeli

Editor tarafinda barkod elemani iki katmanda ele alinir:

- EPL uretimi icin barkod komutu
- React/HTML template icin epl-barcode etiketi

Template icinde barkod su bilgileri tasir:

- data-format
- data-module-width
- data-wide-width
- data-height
- data-display-value

Bu yapi, baska bir React uygulamasinda react-barcode gibi bir bileşene donusturulmeyi kolaylastirir.

## Etiket Metaverisi

Sablon sadece elemanlardan ibaret degildir. Baskiyi etkileyen genel etiket bilgileri de backend'e gonderilir.

Bu projede kaynak kabul edilen metaveriler:

- DPI
- etiket genisligi mm
- etiket yuksekligi mm
- X offset
- Y offset

Turetilmis alanlar, ornegin dot genisligi ve yuksekligi, sabitlerden hesaplanir.

Varsayilan degerler:

- 300 DPI
- 60mm x 35mm
- 709 x 413 dot
- X offset: 260
- Y offset: 8

## Proje Yapisi

```txt
src/
  App.tsx
  services/
    etiketSablonuService.ts
  designer/
    constants.ts
    types.ts
    utils.ts
    components/
      CanvasPanel.tsx
      DataPanel.tsx
      ElementPreview.tsx
      ElementPropertiesPanel.tsx
      EplOutputPanel.tsx
      LayoutPanel.tsx
      ToolboxPanel.tsx
      editors/
```

## Kullanım Akisi

1. Taslak ac veya yeni taslak olustur.
2. Toolbox uzerinden eleman ekle.
3. Elemanlari canvas uzerinde konumlandir.
4. JSON veri kaynagini yukle.
5. Veri alanlarini elemanlara bagla.
6. EPL ciktiyi kontrol et.
7. React / HTML sablonunu goruntule veya kopyala.
8. Taslagi backend'e kaydet.

## Notlar

- Preview zoom, editor deneyiminin bir parcasidir; baski taniminin bir parcasi degildir.
- Siyah kutu elemani, beyaz yazi ve siyah zemin mantigiyla uretilir.
- Bos siyah kutu desteklenir.
- Barkod onizlemesi react-barcode ile gercege yakin simule edilir.

## Yol Haritasi

- Template renderer helper'i yayinlamak
- epl-barcode etiketini otomatik React bilesenine ceviren runtime eklemek
- Farkli etiket boyutlari ve cihaz profilleri icin preset destegi eklemek
- Sablon fark karsilastirma ve versiyonlama destegi eklemek

## Lisans

Bu repo icin uygun lisansi secip ekleyebilirsiniz. Kurumsal kullanim odakli bir projeyse lisans politikasini yayina almadan once netlestirmek iyi olur.