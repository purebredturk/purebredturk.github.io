var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error("XLSX parse hatası:", e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

const holidays = {
  2025: [
    { name: "Yılbaşı", date: "2025-01-01", passed: false, description: "Yeni bir yılın başlangıcı, umut ve yenilik kutlamaları.", duration: "1 gün" },
    { name: "23 Nisan", date: "2025-04-23", passed: false, description: "Ulusal Egemenlik ve Çocuk Bayramı, TBMM'nin kuruluşu.", duration: "1 gün" },
    { name: "1 Mayıs", date: "2025-05-01", passed: false, description: "Emek ve Dayanışma Günü, işçilerin hakları için kutlama.", duration: "1 gün" },
    { name: "19 Mayıs", date: "2025-05-19", passed: false, description: "Atatürk'ü Anma, Gençlik ve Spor Bayramı.", duration: "1 gün" },
    { name: "15 Temmuz", date: "2025-07-15", passed: false, description: "Demokrasi ve Milli Birlik Günü, darbe girişimine direniş.", duration: "1 gün" },
    { name: "30 Ağustos", date: "2025-08-30", passed: false, description: "Zafer Bayramı, Büyük Taarruz'un yıldönümü.", duration: "1 gün" },
    { name: "29 Ekim", date: "2025-10-29", passed: false, description: "Cumhuriyet Bayramı, Türkiye Cumhuriyeti'nin kuruluşu.", duration: "1.5 gün" },
    { name: "Ramazan Bayramı", date: "2025-03-29", passed: false, description: "Oruç ibadetinin tamamlanması ve bayram sevinci.", duration: "3.5 gün" },
    { name: "Kurban Bayramı", date: "2025-06-05", passed: false, description: "Paylaşım ve yardımlaşma ile Hz. İbrahim'in teslimiyeti anılır.", duration: "4.5 gün" }
  ]
};

const religiousDays = {
  2025: [
    { name: "Ramazan Bayramı", date: "2025-03-29", description: "Oruç ibadetinin tamamlanması ve bayram sevinci." },
    { name: "Kurban Bayramı", date: "2025-06-05", description: "Paylaşım ve yardımlaşma ile Hz. İbrahim'in teslimiyeti anılır." },
    { name: "Mevlid Kandili", date: "2025-09-04", description: "Peygamber Efendimiz'in doğumu, dua ve ibadetle anılır." },
    { name: "Regaip Kandili", date: "2025-01-29", description: "Üç ayların başlangıcı, manevi hazırlık gecesi." },
    { name: "Miraç Kandili", date: "2025-02-19", description: "Peygamber'in göğe yükselişi, ibadet ve dua gecesi." },
    { name: "Berat Kandili", date: "2025-03-13", description: "Günahlardan arınma ve af dileme gecesi." },
    { name: "Kadir Gecesi", date: "2025-03-26", description: "Kuran'ın indirildiği gece, ibadet ve dua ile geçirilir." }
  ]
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('tr-TR', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function calculateDaysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return React.createElement('span', { className: 'text-purple-300 font-bold' }, 'Bugün! 🎉');
  return diffDays > 0 
    ? React.createElement('span', { className: 'text-green-300' }, `${diffDays} gün kaldı`)
    : React.createElement('span', { className: 'text-red-300' }, 'Geçti 😢');
}

function calculateAge(birthDate) {
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (today > nextBirthday) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const daysToBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

  const zodiac = getZodiac(birthDate.getDate(), birthDate.getMonth() + 1);

  return { years, months, days, daysToBirthday, zodiac };
}

function getZodiac(day, month) {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) return 'Koç';
  if ((month === 4 && day >= 21) || (month === 5 && day <= 21)) return 'Boğa';
  if ((month === 5 && day >= 22) || (month === 6 && day <= 22)) return 'İkizler';
  if ((month === 6 && day >= 23) || (month === 7 && day <= 22)) return 'Yengeç';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Aslan';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Başak';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Terazi';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Akrep';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Yay';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Oğlak';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Kova';
  return 'Balık';
}

const App = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const tabs = [
    { id: 'home', name: 'Ana Sayfa', component: Home },
    { id: 'shopping', name: 'Alışveriş', component: ShoppingCalculator },
    { id: 'holidays', name: 'Önemli Günler', component: ImportantDays },
    { id: 'tools', name: 'Araçlar', component: Tools }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return React.createElement(
    'div',
    { className: 'container' },
    React.createElement(
      'header',
      { className: 'mb-8 flex justify-between items-center' },
      React.createElement('h1', { className: 'text-2xl sm:text-3xl font-bold text-white' }, 'Renkli Günlük İşler'),
      React.createElement(
        'nav',
        { className: 'flex items-center' },
        React.createElement(
          'ul',
          { className: `nav-list ${isMenuOpen ? 'open flex' : 'hidden sm:flex'} flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4` },
          tabs.map(tab => React.createElement(
            'li',
            { key: tab.id },
            React.createElement(
              'button',
              {
                className: `nav-link px-3 py-2 rounded-lg text-white hover-bg ${activeTab === tab.id ? 'active' : ''}`,
                onClick: () => {
                  setActiveTab(tab.id);
                  setIsMenuOpen(false);
                }
              },
              tab.name
            )
          ))
        ),
        React.createElement(
          'div',
          { className: `hamburger-icon sm:hidden flex ${isMenuOpen ? 'open' : ''}`, onClick: toggleMenu },
          React.createElement('span', null),
          React.createElement('span', null),
          React.createElement('span', null)
        )
      )
    ),
    React.createElement(
      'main',
      null,
      tabs.find(tab => tab.id === activeTab).component()
    )
  );
};

const Home = () => {
  return React.createElement(
    'div',
    { className: 'space-y-8' },
    React.createElement(NewYearCountdown, null),
    React.createElement(NoteTaker, null)
  );
};

const ImportantDays = () => {
  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, '2025 Önemli Günler 📅'),
    React.createElement(
      'div',
      { className: 'overflow-x-auto' },
      React.createElement(
        'table',
        { className: 'w-full text-left text-white' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            { className: 'bg-gray-700' },
            ['Tatil', 'Tarih', 'Kalan Gün', 'Açıklama', 'Süre'].map((header, index) =>
              React.createElement('th', { key: index, className: 'p-3' }, header)
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          holidays[2025].map((holiday, index) =>
            React.createElement(
              'tr',
              { key: index, className: 'border-b border-gray-600 hover:bg-gray-700' },
              React.createElement('td', { className: 'p-3' }, holiday.name),
              React.createElement('td', { className: 'p-3' }, formatDate(holiday.date)),
              React.createElement('td', { className: 'p-3' }, calculateDaysUntil(holiday.date)),
              React.createElement('td', { className: 'p-3' }, holiday.description),
              React.createElement('td', { className: 'p-3' }, holiday.duration)
            )
          )
        )
      )
    ),
    React.createElement('h3', { className: 'text-xl font-semibold mt-8 mb-4 text-white' }, '2025 Dini Günler 🕌'),
    React.createElement(
      'div',
      { className: 'overflow-x-auto' },
      React.createElement(
        'table',
        { className: 'w-full text-left text-white' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            { className: 'bg-gray-700' },
            ['Gün', 'Tarih', 'Kalan Gün', 'Açıklama'].map((header, index) =>
              React.createElement('th', { key: index, className: 'p-3' }, header)
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          religiousDays[2025].map((day, index) =>
            React.createElement(
              'tr',
              { key: index, className: 'border-b border-gray-600 hover:bg-gray-700' },
              React.createElement('td', { className: 'p-3' }, day.name),
              React.createElement('td', { className: 'p-3' }, formatDate(day.date)),
              React.createElement('td', { className: 'p-3' }, calculateDaysUntil(day.date)),
              React.createElement('td', { className: 'p-3' }, day.description)
            )
          )
        )
      )
    )
  );
};

const Tools = () => {
  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' },
    React.createElement(PasswordGenerator, null),
    React.createElement(AgeCalculator, null),
    React.createElement(Stopwatch, null),
    React.createElement(CountdownTimer, null),
    React.createElement(UnitConverter, null),
    React.createElement(CurrencyConverter, null),
    React.createElement(TodoList, null),
    React.createElement(WeatherWidget, null),
    React.createElement(BMICalculator, null),
    React.createElement(TipCalculator, null),
    React.createElement(RandomQuote, null),
    React.createElement(ColorPicker, null),
    React.createElement(QRCodeGenerator, null),
    React.createElement(FileConverter, null),
    React.createElement(WordCounter, null),
    React.createElement(TimeZoneConverter, null),
    React.createElement(MathCalculator, null),
    React.createElement(PasswordVault, null),
    React.createElement(MemoryGame, null)
  );
};

const ShoppingCalculator = () => {
  const [items, setItems] = React.useState([{ name: '', price: '', quantity: 1, weight: '', category: '', unit: 'adet' }]);
  const [taxRate, setTaxRate] = React.useState(18);
  const [discount, setDiscount] = React.useState(0);
  const [budget, setBudget] = React.useState('');
  const [notification, setNotification] = React.useState('');
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [favorites, setFavorites] = React.useState(() => JSON.parse(localStorage.getItem('favorites')) || []);
  const [pastLists, setPastLists] = React.useState(() => JSON.parse(localStorage.getItem('pastLists')) || []);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);

  const categories = ['Gıda', 'İçecek', 'Temizlik', 'Kişisel Bakım', 'Diğer'];
  const suggestions = {
    'Ekmek': ['Peynir', 'Tereyağı'],
    'Süt': ['Kahvaltılık Gevrek', 'Yoğurt'],
    'Deterjan': ['Yumuşatıcı', 'Sünger']
  };

  React.useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('pastLists', JSON.stringify(pastLists));
  }, [favorites, pastLists]);

  const addItem = () => {
    setItems([...items, { name: '', price: '', quantity: 1, weight: '', category: '', unit: 'adet' }]);
    setNotification('Yeni ürün eklendi! 🛒');
    setTimeout(() => setNotification(''), 2000);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
    setNotification('Ürün kaldırıldı! 🗑️');
    setTimeout(() => setNotification(''), 2000);
  };

  const addToFavorites = (item) => {
    if (!favorites.some(fav => fav.name === item.name)) {
      setFavorites([...favorites, item]);
      setNotification('Favorilere eklendi! ⭐');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const loadFavorite = (fav) => {
    setItems([...items, { ...fav, quantity: 1, weight: '', unit: 'adet' }]);
    setNotification('Favori eklendi! 🛒');
    setTimeout(() => setNotification(''), 2000);
  };

  const saveList = () => {
    const listName = prompt('Liste adını girin:');
    if (listName && items.length > 0) {
      setPastLists([...pastLists, { name: listName, items, date: new Date().toLocaleString('tr-TR') }]);
      setNotification('Liste kaydedildi! 💾');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const loadPastList = (list) => {
    setItems(list.items);
    setNotification('Geçmiş liste yüklendi! 📜');
    setTimeout(() => setNotification(''), 2000);
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.onstart = () => {
        setIsRecording(true);
        setNotification('Ses kaydı başladı! 🎙️');
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setItems([...items, { name: transcript, price: '', quantity: 1, weight: '', category: '', unit: 'adet' }]);
        setNotification('Ürün sesle eklendi! 🛒');
        setTimeout(() => setNotification(''), 2000);
      };
      recognition.onend = () => {
        setIsRecording(false);
        setNotification('Ses kaydı bitti! ✅');
        setTimeout(() => setNotification(''), 2000);
      };
      recognition.start();
    } else {
      setNotification('Tarayıcınız ses girişini desteklemiyor! 😞');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const startBarcodeScan = () => {
    setIsScanning(true);
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#barcode-scanner'),
        constraints: { width: 640, height: 480, facingMode: "environment" }
      },
      decoder: { readers: ["ean_reader"] }
    }, (err) => {
      if (err) {
        setNotification('Barkod tarama başlatılamadı! 😞');
        setTimeout(() => setNotification(''), 2000);
        setIsScanning(false);
        return;
      }
      Quagga.start();
      setNotification('Barkod tarama başladı! 📷');
    });

    Quagga.onDetected((data) => {
      const code = data.codeResult.code;
      const product = { name: `Ürün (${code})`, price: '', quantity: 1, weight: '', category: '', unit: 'adet' };
      setItems([...items, product]);
      setNotification('Barkod okundu! 🛒');
      Quagga.stop();
      setIsScanning(false);
      setTimeout(() => setNotification(''), 2000);
    });
  };

  const calculateTotal = React.useMemo(() => {
    let subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);
    const tax = (subtotal * taxRate) / 100;
    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0) * (parseInt(item.quantity) || 1), 0);
    const total = subtotal + tax - (parseFloat(discount) || 0);
    return { subtotal, tax, total, totalWeight };
  }, [items, taxRate, discount]);

  const unitPrices = items.map(item => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return price / quantity;
  });

  const shareList = () => {
    const listText = items.map(item => `${item.name} x${item.quantity}: ${item.price} TL`).join('\n');
    const totalText = `Toplam: ${calculateTotal.total.toFixed(2)} TL`;
    const shareUrl = `whatsapp://send?text=${encodeURIComponent(`${listText}\n${totalText}`)}`;
    window.location.href = shareUrl;
    setNotification('Liste paylaşılıyor! 📤');
    setTimeout(() => setNotification(''), 2000);
  };

  const generateReceipt = () => {
    setShowReceipt(true);
  };

  const downloadReceipt = () => {
    const now = new Date().toLocaleString('tr-TR');
    const receiptText = `
Market Fişi
Tarih: ${now}
--------------------------------
${items.map(item => `${item.name || 'Ürün'} x${item.quantity} (${item.unit}): ${(parseFloat(item.price) * item.quantity).toFixed(2)} TL (Ağırlık: ${item.weight || 0} kg)`).join('\n')}
--------------------------------
Ara Toplam: ${calculateTotal.subtotal.toFixed(2)} TL
KDV (%${taxRate}): ${calculateTotal.tax.toFixed(2)} TL
İndirim: ${discount} TL
Toplam Ağırlık: ${calculateTotal.totalWeight.toFixed(2)} kg
Toplam: ${calculateTotal.total.toFixed(2)} TL
--------------------------------
Teşekkür ederiz!
    `;
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_fisi_${now.replace(/[, :]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification('Fiş indirildi! 📥');
    setTimeout(() => setNotification(''), 2000);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Alışveriş Hesapla 🛒'),
    React.createElement(
      'div',
      { className: 'flex space-x-2 mb-4 flex-wrap gap-y-2' },
      React.createElement('input', {
        type: 'number',
        placeholder: 'Bütçe (TL)',
        value: budget,
        onChange: (e) => setBudget(e.target.value),
        className: 'w-24 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
      }),
      React.createElement('button', {
        onClick: startVoiceInput,
        className: `bg-${isRecording ? 'red' : 'purple'}-600 text-white px-3 py-2 rounded-lg hover:bg-${isRecording ? 'red' : 'purple'}-700 transition`
      }, isRecording ? 'Kaydı Durdur' : 'Sesle Ekle 🎙️'),
      React.createElement('button', {
        onClick: startBarcodeScan,
        className: 'bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition'
      }, 'Barkod Tara 📷')
    ),
    isScanning && React.createElement('div', { id: 'barcode-scanner', className: 'mb-4' }),
    items.map((item, index) => {
      const suggestionItems = suggestions[item.name] || [];
      return React.createElement(
        'div',
        { key: index, className: 'flex flex-col space-y-2 mb-4' },
        React.createElement(
          'div',
          { className: 'flex space-x-2 flex-wrap gap-y-2' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Ürün adı',
            value: item.name,
            onChange: (e) => updateItem(index, 'name', e.target.value),
            className: 'flex-1 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]'
          }),
          React.createElement('input', {
            type: 'number',
            placeholder: 'Fiyat',
            value: item.price,
            onChange: (e) => updateItem(index, 'price', e.target.value),
            className: 'w-24 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
          }),
          React.createElement('input', {
            type: 'number',
            placeholder: 'Adet',
            value: item.quantity,
            onChange: (e) => updateItem(index, 'quantity', e.target.value),
            className: 'w-16 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500',
            min: 1
          }),
          React.createElement('input', {
            type: 'number',
            placeholder: 'Ağırlık (kg)',
            value: item.weight,
            onChange: (e) => updateItem(index, 'weight', e.target.value),
            className: 'w-24 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
          }),
          React.createElement('select', {
            value: item.category,
            onChange: (e) => updateItem(index, 'category', e.target.value),
            className: 'w-32 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
          }, [
            React.createElement('option', { value: '' }, 'Kategori seç'),
            ...categories.map(cat => React.createElement('option', { key: cat, value: cat }, cat))
          ]),
          React.createElement('select', {
            value: item.unit,
            onChange: (e) => updateItem(index, 'unit', e.target.value),
            className: 'w-24 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
          }, ['adet', 'kg', 'lt'].map(unit => React.createElement('option', { key: unit, value: unit }, unit))),
          React.createElement('button', {
            onClick: () => removeItem(index),
            className: 'bg-red-600 text-white px-3 rounded-lg hover:bg-red-700 transition min-w-[40px]'
          }, React.createElement('i', { className: 'fas fa-trash' })),
          React.createElement('button', {
            onClick: () => addToFavorites(item),
            className: 'bg-yellow-600 text-white px-3 rounded-lg hover:bg-yellow-700 transition min-w-[40px]'
          }, React.createElement('i', { className: 'fas fa-star' }))
        ),
        suggestionItems.length > 0 && React.createElement(
          'div',
          { className: 'text-sm text-gray-300' },
          'Öneriler: ',
          suggestionItems.map((sug, i) => React.createElement(
            'button',
            {
              key: i,
              onClick: () => setItems([...items, { name: sug, price: '', quantity: 1, weight: '', category: '', unit: 'adet' }]),
              className: 'underline hover:text-purple-300 mr-2'
            },
            sug
          ))
        )
      );
    }),
    React.createElement('button', {
      onClick: addItem,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition font-semibold mb-4'
    }, 'Ürün Ekle 🛍️'),
    React.createElement(
      'div',
      { className: 'flex space-x-4 mb-4 flex-wrap gap-y-2' },
      React.createElement(
        'div',
        { className: 'flex-1 min-w-[120px]' },
        React.createElement('label', { className: 'block text-sm mb-2 text-white' }, 'KDV Oranı (%)'),
        React.createElement('input', {
          type: 'number',
          value: taxRate,
          onChange: (e) => setTaxRate(e.target.value),
          className: 'w-full bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
        })
      ),
      React.createElement(
        'div',
        { className: 'flex-1 min-w-[120px]' },
        React.createElement('label', { className: 'block text-sm mb-2 text-white' }, 'İndirim (TL)'),
        React.createElement('input', {
          type: 'number',
          value: discount,
          onChange: (e) => setDiscount(e.target.value),
          className: 'w-full bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
        })
      )
    ),
    React.createElement(
      'div',
      { className: 'result-box mt-4' },
      React.createElement('p', { className: 'text-white' }, `Ara Toplam: ${calculateTotal.subtotal.toFixed(2)} TL`),
      React.createElement('p', { className: 'text-white' }, `KDV (%${taxRate}): ${calculateTotal.tax.toFixed(2)} TL`),
      React.createElement('p', { className: 'text-white' }, `İndirim: ${discount} TL`),
      React.createElement('p', { className: 'text-white' }, `Toplam Ağırlık: ${calculateTotal.totalWeight.toFixed(2)} kg`),
      React.createElement('p', {
        className: `font-bold ${budget && calculateTotal.total > parseFloat(budget) ? 'text-red-300' : 'text-purple-300'}`
      }, `Toplam: ${calculateTotal.total.toFixed(2)} TL ${budget ? `(Bütçe: ${budget} TL)` : ''} 💸`),
      unitPrices.length > 0 && React.createElement('p', { className: 'text-white' }, `En Ucuz Birim Fiyat: ${Math.min(...unitPrices.filter(p => p > 0)).toFixed(2)} TL`)
    ),
    React.createElement(
      'div',
      { className: 'flex space-x-2 mt-4 flex-wrap gap-y-2' },
      React.createElement('button', {
        onClick: generateReceipt,
        className: 'flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold'
      }, 'Hesaplamayı Bitir 🧾'),
      React.createElement('button', {
        onClick: shareList,
        className: 'flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold'
      }, 'Paylaş 📤'),
      React.createElement('button', {
        onClick: saveList,
        className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold'
      }, 'Listeyi Kaydet 💾')
    ),
    favorites.length > 0 && React.createElement(
      'div',
      { className: 'mt-4' },
      React.createElement('h4', { className: 'text-white mb-2' }, 'Favoriler ⭐'),
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-2' },
        favorites.map((fav, i) => React.createElement(
          'button',
          {
            key: i,
            onClick: () => loadFavorite(fav),
            className: 'bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition'
          },
          fav.name
        ))
      )
    ),
    pastLists.length > 0 && React.createElement(
      'div',
      { className: 'mt-4' },
      React.createElement('h4', { className: 'text-white mb-2' }, 'Geçmiş Listeler 📜'),
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-2' },
        pastLists.map((list, i) => React.createElement(
          'button',
          {
            key: i,
            onClick: () => loadPastList(list),
            className: 'bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition'
          },
          `${list.name} (${list.date})`
        ))
      )
    ),
    notification && React.createElement('div', { className: 'notification' }, notification),
    showReceipt && React.createElement(
      'div',
      { className: 'modal' },
      React.createElement(
        'div',
        { className: 'modal-content' },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center mb-4' },
          React.createElement('h3', { className: 'text-xl font-semibold text-white' }, 'Market Fişi'),
          React.createElement('button', {
            onClick: () => setShowReceipt(false),
            className: 'text-purple-300 hover:text-purple-400'
          }, React.createElement('i', { className: 'fas fa-times' }))
        ),
        React.createElement(
          'div',
          { className: 'text-white' },
          React.createElement('p', null, React.createElement('strong', null, 'Tarih:'), ` ${new Date().toLocaleString('tr-TR')}`),
          React.createElement('hr', { className: 'my-2 border-gray-500' }),
          items.map((item, index) =>
            React.createElement('p', { key: index }, `${item.name || 'Ürün'} x${item.quantity} (${item.unit}): ${(parseFloat(item.price) * item.quantity).toFixed(2)} TL (Ağırlık: ${item.weight || 0} kg)`)
          ),
          React.createElement('hr', { className: 'my-2 border-gray-500' }),
          React.createElement('p', null, React.createElement('strong', null, 'Ara Toplam:'), ` ${calculateTotal.subtotal.toFixed(2)} TL`),
          React.createElement('p', null, React.createElement('strong', null, `KDV (%${taxRate}):`), ` ${calculateTotal.tax.toFixed(2)} TL`),
          React.createElement('p', null, React.createElement('strong', null, 'İndirim:'), ` ${discount} TL`),
          React.createElement('p', null, React.createElement('strong', null, 'Toplam Ağırlık:'), ` ${calculateTotal.totalWeight.toFixed(2)} kg`),
          React.createElement('p', null, React.createElement('strong', null, 'Toplam:'), ` ${calculateTotal.total.toFixed(2)} TL`),
          React.createElement('hr', { className: 'my-2 border-gray-500' }),
          React.createElement('p', { className: 'text-center text-gray-300' }, 'Teşekkür ederiz!')
        ),
        React.createElement('button', {
          onClick: downloadReceipt,
          className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition font-semibold mt-4'
        }, 'Fişi İndir 📥')
      )
    )
  );
};

// Additional Tools Components
const UnitConverter = () => {
  const [value, setValue] = React.useState('');
  const [fromUnit, setFromUnit] = React.useState('m');
  const [toUnit, setToUnit] = React.useState('cm');
  const [result, setResult] = React.useState('');

  const units = {
    length: { 'm': 1, 'cm': 100, 'km': 0.001 },
    weight: { 'kg': 1, 'g': 1000, 'ton': 0.001 }
  };

  const convert = () => {
    const val = parseFloat(value);
    if (!isNaN(val)) {
      const fromFactor = units[fromUnit.length ? 'length' : 'weight'][fromUnit];
      const toFactor = units[toUnit.length ? 'length' : 'weight'][toUnit];
      setResult((val * fromFactor / toFactor).toFixed(2));
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Birim Çevirici 📏'),
    React.createElement('input', {
      type: 'number',
      value: value,
      onChange: (e) => setValue(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('select', {
      value: fromUnit,
      onChange: (e) => setFromUnit(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, Object.keys(units.length).map(k => React.createElement('option', { value: k }, k))),
    React.createElement('select', {
      value: toUnit,
      onChange: (e) => setToUnit(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, Object.keys(units.length).map(k => React.createElement('option', { value: k }, k))),
    React.createElement('button', {
      onClick: convert,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Çevir'),
    result && React.createElement('p', { className: 'text-white mt-2' }, `${result} ${toUnit}`)
  );
};

const CurrencyConverter = () => {
  const [amount, setAmount] = React.useState('');
  const [fromCurrency, setFromCurrency] = React.useState('USD');
  const [toCurrency, setToCurrency] = React.useState('TRY');
  const [result, setResult] = React.useState('');

  const rates = { 'USD': 1, 'TRY': 33, 'EUR': 0.85 }; // Mock rates

  const convert = () => {
    const amt = parseFloat(amount);
    if (!isNaN(amt)) {
      const rate = rates[toCurrency] / rates[fromCurrency];
      setResult((amt * rate).toFixed(2));
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Döviz Çevirici 💸'),
    React.createElement('input', {
      type: 'number',
      value: amount,
      onChange: (e) => setAmount(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('select', {
      value: fromCurrency,
      onChange: (e) => setFromCurrency(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, Object.keys(rates).map(k => React.createElement('option', { value: k }, k))),
    React.createElement('select', {
      value: toCurrency,
      onChange: (e) => setToCurrency(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, Object.keys(rates).map(k => React.createElement('option', { value: k }, k))),
    React.createElement('button', {
      onClick: convert,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Çevir'),
    result && React.createElement('p', { className: 'text-white mt-2' }, `${result} ${toCurrency}`)
  );
};

const TodoList = () => {
  const [tasks, setTasks] = React.useState([]);
  const [newTask, setNewTask] = React.useState('');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Yapılacaklar Listesi ✅'),
    React.createElement('input', {
      type: 'text',
      value: newTask,
      onChange: (e) => setNewTask(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: addTask,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Ekle'),
    React.createElement('ul', { className: 'mt-2' }, tasks.map(task =>
      React.createElement('li', {
        key: task.id,
        className: `text-white ${task.completed ? 'line-through' : ''}`
      }, React.createElement('input', {
        type: 'checkbox',
        checked: task.completed,
        onChange: () => toggleTask(task.id),
        className: 'mr-2'
      }), task.text)
    ))
  );
};

const WeatherWidget = () => {
  const [city, setCity] = React.useState('İstanbul');
  const [weather, setWeather] = React.useState('Hava durumu simüle edildi: 20°C, Parçalı Bulutlu');

  const fetchWeather = () => {
    setWeather(`Hava durumu simüle edildi: ${Math.floor(Math.random() * 30)}°C, ${['Açık', 'Bulutlu', 'Yağmurlu'][Math.floor(Math.random() * 3)]}`);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Hava Durumu ☀️'),
    React.createElement('input', {
      type: 'text',
      value: city,
      onChange: (e) => setCity(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: fetchWeather,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Sorgula'),
    React.createElement('p', { className: 'text-white mt-2' }, weather)
  );
};

const BMICalculator = () => {
  const [weight, setWeight] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [bmi, setBmi] = React.useState('');

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w && h) {
      setBmi((w / (h * h)).toFixed(2));
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'BMI Hesaplayıcı 🏋️'),
    React.createElement('input', {
      type: 'number',
      placeholder: 'Kilo (kg)',
      value: weight,
      onChange: (e) => setWeight(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('input', {
      type: 'number',
      placeholder: 'Boy (cm)',
      value: height,
      onChange: (e) => setHeight(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: calculateBMI,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Hesapla'),
    bmi && React.createElement('p', { className: 'text-white mt-2' }, `BMI: ${bmi}`)
  );
};

const TipCalculator = () => {
  const [amount, setAmount] = React.useState('');
  const [tipPercent, setTipPercent] = React.useState(10);
  const [people, setPeople] = React.useState(1);
  const [result, setResult] = React.useState('');

  const calculateTip = () => {
    const amt = parseFloat(amount);
    const ppl = parseInt(people) || 1;
    if (amt) {
      const tip = (amt * tipPercent) / 100;
      const total = (amt + tip) / ppl;
      setResult(`Kişi başı: ${total.toFixed(2)} TL (Bahşiş: ${tip.toFixed(2)} TL)`);
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Bahşiş Hesaplayıcı 💰'),
    React.createElement('input', {
      type: 'number',
      placeholder: 'Tutar (TL)',
      value: amount,
      onChange: (e) => setAmount(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('input', {
      type: 'number',
      placeholder: 'Bahşiş %',
      value: tipPercent,
      onChange: (e) => setTipPercent(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('input', {
      type: 'number',
      placeholder: 'Kişi Sayısı',
      value: people,
      onChange: (e) => setPeople(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: calculateTip,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Hesapla'),
    result && React.createElement('p', { className: 'text-white mt-2' }, result)
  );
};

const RandomQuote = () => {
  const [quote, setQuote] = React.useState('');

  const quotes = [
    'Hayat bir yolculuktur, varış noktası değil.',
    'Küçük adımlar büyük değişimlere yol açar.',
    'Mutluluk paylaştıkça artar.'
  ];

  const getQuote = () => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Rastgele Alıntı 📜'),
    React.createElement('button', {
      onClick: getQuote,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Alıntı Getir'),
    quote && React.createElement('p', { className: 'text-white mt-2 italic' }, `"${quote}"`)
  );
};

const ColorPicker = () => {
  const [color, setColor] = React.useState('#ffffff');

  const copyColor = () => {
    navigator.clipboard.writeText(color);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Renk Seçici 🎨'),
    React.createElement('input', {
      type: 'color',
      value: color,
      onChange: (e) => setColor(e.target.value),
      className: 'w-full h-12 mb-2'
    }),
    React.createElement('p', { className: 'text-white mb-2' }, color),
    React.createElement('button', {
      onClick: copyColor,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Kopyala')
  );
};

const QRCodeGenerator = () => {
  const [text, setText] = React.useState('');
  const [qrUrl, setQrUrl] = React.useState('');

  const generateQR = () => {
    if (text) {
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`);
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'QR Kod Üretici 📲'),
    React.createElement('input', {
      type: 'text',
      value: text,
      onChange: (e) => setText(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: generateQR,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Üret'),
    qrUrl && React.createElement('img', { src: qrUrl, alt: 'QR Code', className: 'mt-2 mx-auto' })
  );
};

const FileConverter = () => {
  const [text, setText] = React.useState('');
  const [format, setFormat] = React.useState('txt');

  const convert = () => {
    const blob = new Blob([text], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Dosya Dönüştürücü 📄'),
    React.createElement('textarea', {
      value: text,
      onChange: (e) => setText(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2',
      rows: 4
    }),
    React.createElement('select', {
      value: format,
      onChange: (e) => setFormat(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, ['txt', 'csv'].map(f => React.createElement('option', { value: f }, f))),
    React.createElement('button', {
      onClick: convert,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Dönüştür')
  );
};

const WordCounter = () => {
  const [text, setText] = React.useState('');
  const count = text.trim().split(/\s+/).filter(w => w).length;

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Kelime Sayacı ✍️'),
    React.createElement('textarea', {
      value: text,
      onChange: (e) => setText(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2',
      rows: 4
    }),
    React.createElement('p', { className: 'text-white' }, `Kelime: ${count}, Karakter: ${text.length}`)
  );
};

const TimeZoneConverter = () => {
  const [time, setTime] = React.useState(new Date().toISOString().slice(0, 16));
  const [fromZone, setFromZone] = React.useState('Europe/Istanbul');
  const [toZone, setToZone] = React.useState('America/New_York');
  const [result, setResult] = React.useState('');

  const convert = () => {
    const fromDate = new Date(time);
    const options = { timeZone: toZone, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    setResult(fromDate.toLocaleString('tr-TR', options));
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Zaman Dilimi Çevirici ⏳'),
    React.createElement('input', {
      type: 'datetime-local',
      value: time,
      onChange: (e) => setTime(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('select', {
      value: fromZone,
      onChange: (e) => setFromZone(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, ['Europe/Istanbul', 'America/New_York', 'Asia/Tokyo'].map(z => React.createElement('option', { value: z }, z))),
    React.createElement('select', {
      value: toZone,
      onChange: (e) => setToZone(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }, ['Europe/Istanbul', 'America/New_York', 'Asia/Tokyo'].map(z => React.createElement('option', { value: z }, z))),
    React.createElement('button', {
      onClick: convert,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Çevir'),
    result && React.createElement('p', { className: 'text-white mt-2' }, result)
  );
};

const MathCalculator = () => {
  const [expression, setExpression] = React.useState('');
  const [result, setResult] = React.useState('');

  const calculate = () => {
    try {
      setResult(eval(expression).toString());
    } catch {
      setResult('Hata');
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Matematik Hesap Makinesi ➕'),
    React.createElement('input', {
      type: 'text',
      value: expression,
      onChange: (e) => setExpression(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: calculate,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Hesapla'),
    result && React.createElement('p', { className: 'text-white mt-2' }, `Sonuç: ${result}`)
  );
};

const PasswordVault = () => {
  const [passwords, setPasswords] = React.useState([]);
  const [newPass, setNewPass] = React.useState('');

  const addPassword = () => {
    if (newPass.trim()) {
      const encrypted = CryptoJS.AES.encrypt(newPass, 'secret-key').toString();
      setPasswords([...passwords, { id: Date.now(), encrypted }]);
      setNewPass('');
    }
  };

  const decryptPassword = (encrypted) => {
    return CryptoJS.AES.decrypt(encrypted, 'secret-key').toString(CryptoJS.enc.Utf8);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Şifre Kasası 🔐'),
    React.createElement('input', {
      type: 'password',
      value: newPass,
      onChange: (e) => setNewPass(e.target.value),
      className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2'
    }),
    React.createElement('button', {
      onClick: addPassword,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition'
    }, 'Ekle'),
    React.createElement('ul', { className: 'mt-2' }, passwords.map(p =>
      React.createElement('li', { key: p.id, className: 'text-white' }, React.createElement('button', {
        onClick: () => navigator.clipboard.writeText(decryptPassword(p.encrypted)),
        className: 'underline'
      }, 'Şifreyi Kopyala'))
    ))
  );
};

const MemoryGame = () => {
  const [cards, setCards] = React.useState([]);
  const [flipped, setFlipped] = React.useState([]);
  const [matched, setMatched] = React.useState([]);

  React.useEffect(() => {
    const symbols = ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'];
    setCards(symbols.sort(() => Math.random() - 0.5).map((s, i) => ({ id: i, symbol: s })));
  }, []);

  const flipCard = (id) => {
    if (flipped.length < 2 && !flipped.includes(id) && !matched.includes(id)) {
      const newFlipped = [...flipped, id];
      setFlipped(newFlipped);
      if (newFlipped.length === 2) {
        const [first, second] = newFlipped;
        if (cards[first].symbol === cards[second].symbol) {
          setMatched([...matched, first, second]);
        }
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Hafıza Oyunu 🧠'),
    React.createElement('div', { className: 'grid grid-cols-4 gap-2' }, cards.map(card =>
      React.createElement('div', {
        key: card.id,
        onClick: () => flipCard(card.id),
        className: `w-12 h-12 flex items-center justify-center bg-gray-700 rounded-lg cursor-pointer ${flipped.includes(card.id) || matched.includes(card.id) ? 'text-white' : 'text-gray-700'}`
      }, flipped.includes(card.id) || matched.includes(card.id) ? card.symbol : '?')
    ))
  );
};

const NewYearCountdown = React.memo(() => {
  const [timeLeft, setTimeLeft] = React.useState({});

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const today = new Date();
      const nextNewYear = new Date(today.getFullYear() + 1, 0, 1);
      const diff = nextNewYear - today;

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return React.createElement(
    'div',
    { className: 'newyear-container' },
    React.createElement(
      'h3',
      { className: 'text-2xl sm:text-3xl font-bold text-center text-white mb-6' },
      'Yeni Yıla Geri Sayım 🎉'
    ),
    React.createElement(
      'div',
      { className: 'clock-container' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 sm:grid-cols-4 gap-4' },
        ['days', 'hours', 'minutes', 'seconds'].map((unit, index) =>
          React.createElement(
            'div',
            { key: index, className: 'clock-item' },
            React.createElement(
              'div',
              { className: 'clock-value' },
              timeLeft[unit] || 0
            ),
            React.createElement(
              'div',
              { className: 'clock-label' },
              unit === 'days' ? 'Gün' : unit === 'hours' ? 'Saat' : unit === 'minutes' ? 'Dakika' : 'Saniye'
            )
          )
        )
      )
    )
  );
});

const NoteTaker = () => {
  const [notes, setNotes] = React.useState(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [newNote, setNewNote] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState(null);
  const [editingNoteText, setEditingNoteText] = React.useState('');
  const [notification, setNotification] = React.useState('');
  const [deletingNoteId, setDeletingNoteId] = React.useState(null);

  React.useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, { id: Date.now(), text: newNote, date: new Date().toLocaleString('tr-TR') }]);
      setNewNote('');
      setNotification('Not eklendi! 📝');
      setTimeout(() => setNotification(''), 2000);
    } else {
      setNotification('Not boş olamaz! 😕');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  const saveEdit = () => {
    if (editingNoteText.trim()) {
      setNotes(notes.map(note =>
        note.id === editingNoteId ? { ...note, text: editingNoteText, date: new Date().toLocaleString('tr-TR') } : note
      ));
      setEditingNoteId(null);
      setEditingNoteText('');
      setNotification('Not güncellendi! ✅');
      setTimeout(() => setNotification(''), 2000);
    } else {
      setNotification('Not boş olamaz! 😕');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const deleteNote = (id) => {
    setDeletingNoteId(id);
    setTimeout(() => {
      setNotes(notes.filter(note => note.id !== id));
      setDeletingNoteId(null);
      setNotification('Not silindi! 🗑️');
      setTimeout(() => setNotification(''), 2000);
    }, 300);
  };

  const downloadNotes = () => {
    const notesText = notes.map(note => `${note.date}: ${note.text}`).join('\n\n');
    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notlar.txt';
    a.click();
    URL.revokeObjectURL(url);
    setNotification('Notlar indirildi! 📥');
    setTimeout(() => setNotification(''), 2000);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Not Yaz ✍️'),
    React.createElement(
      'div',
      { className: 'flex mb-4 flex-col' },
      React.createElement('textarea', {
        value: newNote,
        onChange: (e) => setNewNote(e.target.value),
        placeholder: 'Notunuzu buraya yazın...',
        className: 'w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]',
        rows: 3
      }),
      React.createElement('button', {
        onClick: addNote,
        className: 'bg-purple-600 text-white px-4 py-2 rounded-lg mt-2 hover:bg-purple-700 transition font-semibold'
      }, 'Ekle')
    ),
    notes.length > 0 && React.createElement('button', {
      onClick: downloadNotes,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition font-semibold mb-4'
    }, 'Tüm Notları İndir 📥'),
    notification && React.createElement('div', { className: 'notification' }, notification),
    React.createElement(
      'ul',
      { className: 'space-y-2 max-h-64 overflow-y-auto' },
      notes.map(note => React.createElement(
        'li',
        {
          key: note.id,
          className: `result-box p-3 flex flex-col note-item ${deletingNoteId === note.id ? 'fade-out' : ''}`
        },
        editingNoteId === note.id
          ? React.createElement(
              'div',
              { className: 'flex-1 flex flex-col' },
              React.createElement('textarea', {
                value: editingNoteText,
                onChange: (e) => setEditingNoteText(e.target.value),
                className: 'w-full bg-gray-700 text-white rounded-lg p-2 mb-2 outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]',
                rows: 2
              }),
              React.createElement(
                'div',
                { className: 'flex space-x-2' },
                React.createElement('button', {
                  onClick: saveEdit,
                  className: 'bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition min-w-[80px]'
                }, 'Kaydet'),
                React.createElement('button', {
                  onClick: cancelEdit,
                  className: 'bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition min-w-[80px]'
                }, 'İptal')
              )
            )
          : [
              React.createElement(
                'div',
                { className: 'flex-1' },
                React.createElement('p', { className: 'text-white whitespace-pre-wrap' }, note.text),
                React.createElement('p', { className: 'text-xs text-gray-300' }, note.date)
              ),
              React.createElement(
                'div',
                { className: 'flex space-x-2 mt-2' },
                React.createElement('button', {
                  onClick: () => startEditing(note),
                  className: 'text-yellow-400 hover:text-yellow-500'
                }, React.createElement('i', { className: 'fas fa-edit' })),
                React.createElement('button', {
                  onClick: () => deleteNote(note.id),
                  className: 'text-red-400 hover:text-red-500'
                }, React.createElement('i', { className: 'fas fa-trash' }))
              )
            ]
      ))
    )
  );
};

const PasswordGenerator = () => {
  const [password, setPassword] = React.useState('');
  const [length, setLength] = React.useState(12);
  const [includeUppercase, setIncludeUppercase] = React.useState(true);
  const [includeLowercase, setIncludeLowercase] = React.useState(true);
  const [includeNumbers, setIncludeNumbers] = React.useState(true);
  const [includeSymbols, setIncludeSymbols] = React.useState(true);
  const [notification, setNotification] = React.useState('');

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (!chars) {
      setNotification('En az bir karakter türü seç! 😕');
      setTimeout(() => setNotification(''), 2000);
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setNotification('Şifre oluşturuldu! 🎉');
    setTimeout(() => setNotification(''), 2000);
  };

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setNotification('Şifre kopyalandı! 📋');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const encryptPassword = () => {
    if (password) {
      const encrypted = CryptoJS.AES.encrypt(password, 'secret-key').toString();
      setPassword(encrypted);
      setNotification('Şifre şifrelendi! 🔒');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const decryptPassword = () => {
    if (password) {
      try {
        const decrypted = CryptoJS.AES.decrypt(password, 'secret-key').toString(CryptoJS.enc.Utf8);
        if (decrypted) {
          setPassword(decrypted);
          setNotification('Şifre çözüldü! 🔓');
          setTimeout(() => setNotification(''), 2000);
        } else {
          setNotification('Geçersiz şifrelenmiş veri! 😕');
          setTimeout(() => setNotification(''), 2000);
        }
      } catch (e) {
        setNotification('Şifre çözülemedi! 😞');
        setTimeout(() => setNotification(''), 2000);
      }
    }
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Şifre Oluştur 🔒'),
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement('label', { className: 'block text-sm mb-2 text-white' }, `Şifre Uzunluğu: ${length}`),
      React.createElement('input', {
        type: 'range',
        min: 6,
        max: 50,
        value: length,
        onChange: (e) => setLength(e.target.value),
        className: 'w-full accent-purple-500'
      })
    ),
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-4 mb-4' },
      [
        ['Büyük Harf', includeUppercase, setIncludeUppercase],
        ['Küçük Harf', includeLowercase, setIncludeLowercase],
        ['Rakam', includeNumbers, setIncludeNumbers],
        ['Sembol', includeSymbols, setIncludeSymbols]
      ].map(([label, checked, setChecked], index) =>
        React.createElement(
          'label',
          { key: index, className: 'flex items-center text-white' },
          React.createElement(
            'div',
            { className: 'toggle-switch mr-2' },
            React.createElement('input', {
              type: 'checkbox',
              checked: checked,
              onChange: () => setChecked(!checked)
            }),
            React.createElement('span', { className: 'slider' })
          ),
          label
        )
      )
    ),
    React.createElement('button', {
      onClick: generatePassword,
      className: 'bg-purple-600 text-white px-4 py-2 rounded-lg w-full hover:bg-purple-700 transition font-semibold'
    }, 'Şifre Oluştur 🔑'),
    password && React.createElement(
      'div',
      { className: 'result-box mt-4' },
      React.createElement('p', { className: 'break-all text-white font-mono' }, password),
      React.createElement(
        'div',
        { className: 'flex space-x-2 mt-2' },
        React.createElement('button', {
          onClick: copyToClipboard,
          className: 'bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition min-w-[80px]'
        }, 'Kopyala'),
        React.createElement('button', {
          onClick: encryptPassword,
          className: 'bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition min-w-[80px]'
        }, 'Şifrele'),
        React.createElement('button', {
          onClick: decryptPassword,
          className: 'bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition min-w-[80px]'
        }, 'Şifreyi Çöz')
      )
    ),
    notification && React.createElement('div', { className: 'notification' }, notification)
  );
};

const AgeCalculator = () => {
  const [birthDate, setBirthDate] = React.useState('');
  const [age, setAge] = React.useState(null);
  const [notification, setNotification] = React.useState('');

  const calculate = () => {
    if (!birthDate) {
      setNotification('Doğum tarihi seç! 😕');
      setTimeout(() => setNotification(''), 2000);
      return;
    }

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      setNotification('Geçerli bir tarih gir! 😞');
      setTimeout(() => setNotification(''), 2000);
      return;
    }

    const result = calculateAge(birth);
    setAge(result);
    setNotification('Yaş hesaplandı! 🎂');
    setTimeout(() => setNotification(''), 2000);
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Yaş Hesapla 🎂'),
    React.createElement(
      'div',
      { className: 'flex space-x-2 mb-4 flex-wrap gap-y-2' },
      React.createElement('input', {
        type: 'date',
        value: birthDate,
        onChange: (e) => setBirthDate(e.target.value),
        className: 'flex-1 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500'
      }),
      React.createElement('button', {
        onClick: calculate,
        className: 'bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold'
      }, 'Hesapla')
    ),
    age && React.createElement(
      'div',
      { className: 'result-box mt-4' },
      React.createElement('p', { className: 'text-white' }, `Yaş: ${age.years} yıl, ${age.months} ay, ${age.days} gün`),
      React.createElement('p', { className: 'text-white' }, `Bir sonraki doğum gününe: ${age.daysToBirthday} gün`),
      React.createElement('p', { className: 'text-white' }, `Burç: ${age.zodiac}`)
    ),
    notification && React.createElement('div', { className: 'notification' }, notification)
  );
};

const Stopwatch = () => {
  const [time, setTime] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);
  const [laps, setLaps] = React.useState([]);
  const [notification, setNotification] = React.useState('');

  React.useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startStop = () => {
    setIsRunning(!isRunning);
    setNotification(isRunning ? 'Kronometre durduruldu! ⏸️' : 'Kronometre başlatıldı! ▶️');
    setTimeout(() => setNotification(''), 2000);
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setNotification('Kronometre sıfırlandı! 🔄');
    setTimeout(() => setNotification(''), 2000);
  };

  const addLap = () => {
    if (isRunning && time > 0) {
      setLaps([...laps, time]);
      setNotification('Tur eklendi! 🕒');
      setTimeout(() => setNotification(''), 2000);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Kronometre ⏱️'),
    React.createElement(
      'div',
      { className: 'text-4xl sm:text-5xl font-mono text-purple-300 text-center mb-4' },
      formatTime(time)
    ),
    React.createElement(
      'div',
      { className: 'flex space-x-2 mb-4' },
      React.createElement('button', {
        onClick: startStop,
        className: `flex-1 bg-${isRunning ? 'red' : 'green'}-600 text-white px-4 py-2 rounded-lg hover:bg-${isRunning ? 'red' : 'green'}-700 transition font-semibold`
      }, isRunning ? 'Durdur' : 'Başlat'),
      React.createElement('button', {
        onClick: addLap,
        className: 'flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold'
      }, 'Tur'),
      React.createElement('button', {
        onClick: reset,
        className: 'flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold'
      }, 'Sıfırla')
    ),
    laps.length > 0 && React.createElement(
      'div',
      { className: 'result-box mt-4 max-h-40 overflow-y-auto' },
      React.createElement('h4', { className: 'text-white mb-2' }, 'Turlar'),
      React.createElement(
        'ul',
        { className: 'text-white' },
        laps.map((lap, index) =>
          React.createElement('li', { key: index }, `Tur ${index + 1}: ${formatTime(lap)}`)
        )
      )
    ),
    notification && React.createElement('div', { className: 'notification' }, notification)
  );
};

const CountdownTimer = () => {
  const [time, setTime] = React.useState(0);
  const [inputMinutes, setInputMinutes] = React.useState('');
  const [inputSeconds, setInputSeconds] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [notification, setNotification] = React.useState('');

  React.useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev <= 1000) {
            setIsRunning(false);
            setNotification('Süre bitti! ⏰');
            setTimeout(() => setNotification(''), 2000);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const startStop = () => {
    if (!isRunning && time === 0 && (!inputMinutes && !inputSeconds)) {
      setNotification('Önce bir süre gir! 😕');
      setTimeout(() => setNotification(''), 2000);
      return;
    }
    setIsRunning(!isRunning);
    setNotification(isRunning ? 'Geri sayım durduruldu! ⏸️' : 'Geri sayım başlatıldı! ▶️');
    setTimeout(() => setNotification(''), 2000);
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setInputMinutes('');
    setInputSeconds('');
    setNotification('Geri sayım sıfırlandı! 🔄');
    setTimeout(() => setNotification(''), 2000);
  };

  const setTimer = () => {
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    const totalSeconds = (minutes * 60 + seconds) * 1000;
    if (totalSeconds <= 0) {
      setNotification('Geçerli bir süre gir! 😞');
      setTimeout(() => setNotification(''), 2000);
      return;
    }
    setTime(totalSeconds);
    setNotification('Süre ayarlandı! ⏰');
    setTimeout(() => setNotification(''), 2000);
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement('h3', { className: 'text-xl font-semibold mb-4 text-white' }, 'Geri Sayım ⏰'),
    React.createElement(
      'div',
      { className: 'text-4xl sm:text-5xl font-mono text-purple-300 text-center mb-4' },
      formatTime(time)
    ),
    React.createElement(
      'div',
      { className: 'flex space-x-2 mb-4 flex-wrap gap-y-2' },
      React.createElement('input', {
        type: 'number',
        placeholder: 'Dakika',
        value: inputMinutes,
        onChange: (e) => setInputMinutes(e.target.value),
        className: 'flex-1 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 min-w-[100px]'
      }),
      React.createElement('input', {
        type: 'number',
        placeholder: 'Saniye',
        value: inputSeconds,
        onChange: (e) => setInputSeconds(e.target.value),
        className: 'flex-1 bg-gray-700 text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 min-w-[100px]'
      }),
      React.createElement('button', {
        onClick: setTimer,
        className: 'bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-semibold'
      }, 'Ayarla')
    ),
    React.createElement(
      'div',
      { className: 'flex space-x-2' },
      React.createElement('button', {
        onClick: startStop,
        className: `flex-1 bg-${isRunning ? 'red' : 'green'}-600 text-white px-4 py-2 rounded-lg hover:bg-${isRunning ? 'red' : 'green'}-700 transition font-semibold`
      }, isRunning ? 'Durdur' : 'Başlat'),
      React.createElement('button', {
        onClick: reset,
        className: 'flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold'
      }, 'Sıfırla')
    ),
    notification && React.createElement('div', { className: 'notification' }, notification)
  );
};