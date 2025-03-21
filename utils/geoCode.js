const indianStates = {
    // States
    andhrapradesh: { state: 'Andhra Pradesh', coordinates: [80.1918, 15.9129] },
    arunachalpradesh: { state: 'Arunachal Pradesh', coordinates: [94.7278, 28.2180] },
    assam: { state: 'Assam', coordinates: [92.9376, 26.2006] },
    bihar: { state: 'Bihar', coordinates: [85.3131, 25.0961] },
    chhattisgarh: { state: 'Chhattisgarh', coordinates: [81.8661, 21.2787] },
    goa: { state: 'Goa', coordinates: [74.1240, 15.2993] },
    gujarat: { state: 'Gujarat', coordinates: [72.6369, 22.2587] },
    haryana: { state: 'Haryana', coordinates: [76.0856, 29.0588] },
    himachalpradesh: { state: 'Himachal Pradesh', coordinates: [77.1734, 31.1048] },
    jharkhand: { state: 'Jharkhand', coordinates: [85.2799, 23.6102] },
    karnataka: { state: 'Karnataka', coordinates: [75.7139, 15.3173] },
    kerala: { state: 'Kerala', coordinates: [76.2711, 10.8505] },
    madhyapradesh: { state: 'Madhya Pradesh', coordinates: [78.6569, 22.9734] },
    maharashtra: { state: 'Maharashtra', coordinates: [72.8777, 19.0760] },
    manipur: { state: 'Manipur', coordinates: [93.9063, 24.6637] },
    meghalaya: { state: 'Meghalaya', coordinates: [91.3662, 25.4670] },
    mizoram: { state: 'Mizoram', coordinates: [92.9376, 23.1645] },
    nagaland: { state: 'Nagaland', coordinates: [94.5624, 26.1584] },
    odisha: { state: 'Odisha', coordinates: [85.0985, 20.9517] },
    punjab: { state: 'Punjab', coordinates: [75.3412, 31.1471] },
    rajasthan: { state: 'Rajasthan', coordinates: [74.2179, 27.0238] },
    sikkim: { state: 'Sikkim', coordinates: [88.5122, 27.5330] },
    tamilnadu: { state: 'Tamil Nadu', coordinates: [78.6569, 11.1271] },
    telangana: { state: 'Telangana', coordinates: [79.0193, 17.1232] },
    tripura: { state: 'Tripura', coordinates: [91.9882, 23.9408] },
    uttarpradesh: { state: 'Uttar Pradesh', coordinates: [80.9462, 26.8467] },
    uttarakhand: { state: 'Uttarakhand', coordinates: [79.0193, 30.0668] },
    westbengal: { state: 'West Bengal', coordinates: [87.8550, 22.9868] },
  
    // Union Territories
    andamanandnicobar: { state: 'Andaman and Nicobar Islands', coordinates: [92.6586, 11.7401] },
    chandigarh: { state: 'Chandigarh', coordinates: [76.7794, 30.7333] },
    dadraandnagarhavelianddamandiu: { state: 'Dadra and Nagar Haveli and Daman and Diu', coordinates: [72.9985, 20.1809] },
    delhi: { state: 'Delhi', coordinates: [77.1025, 28.7041] },
    jammuandkashmir: { state: 'Jammu and Kashmir', coordinates: [76.5762, 33.7782] },
    ladakh: { state: 'Ladakh', coordinates: [77.6151, 34.2095] },
    lakshadweep: { state: 'Lakshadweep', coordinates: [72.1833, 10.5667] },
    puducherry: { state: 'Puducherry', coordinates: [79.8083, 11.9416] },
  };
  
  exports.extractLocation = async (text) => {
    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(indianStates)) {
      if (lowerText.includes(key)) return value;
    }
    return null;
  };