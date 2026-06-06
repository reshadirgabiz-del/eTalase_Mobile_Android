Slide 1 (chapter header):
{
    Topic: 1. Greetings,
    Objective: Stating the problem we want to solve,
    Text: Hey! Selamat datang di e-Talase 🛍️,
    Illustration: logo.svg
    Text (large): Apa kamu merasa makin susah untung di Marketplace? Khawatir buat toko online karena ribet dan merasa ga worth it?,
    Text (smaller, show one line at a time, fade appear with 0.4s transition):
    Kamu ga sendirian.
    **Banyak penjual yang merasa sama kayak kamu**, baik yang baru mulai atau udah bertahun-tahun jualan.
}

Slide 2:
{
    Topic: 1. Greetings,
    Objective: Our solution to answer the problem,
    Text (large): e-Talase (use svg) kami buat untuk {{please suggest, basically solve the problem stated in Slide 1}},
    Text (smaller, show one line at a time, fade appear with 0.4s transition):
    Penjualan sampai duit masuk kantong dengan potongan 0%
    Dari chat di WA, IG, atau media sosial lain langsung ke platform
    Atur produk, stok, dan pengiriman langsung di satu tempat
}

Slide 3:
{
    Topic: 2. Getting to know you,
    Objective: Get basic information of the user to understand their current situation
    Text (large): Pertama-tama, kita kenalan dulu yuk :)
    Text (smaller): What should we call you?
    Text input: {{Name}}
}

Slide 4:
{
    Topic: 2. Getting to know you,
    Objective: Get basic information of the user to understand their current situation
    Text (large): Pertama-tama, kita kenalan dulu yuk :)
    Text (smaller): Berapa umur kamu?
    Selection: {{Age ranges}}
}

Slide 5:
{
    Topic: 2. Getting to know you,
    Objective: Get basic information of the user to understand their current situation
    Text (large): Apakah sekarang kamu sekarang sedang berjualan (online/offilne)?
    Selection: {{Yes/No}}
}

Slide 6 (if Yes selected in Slide 5):
{
    Topic: 2. Getting to know you,
    Objective: Get basic information of the user to understand their current situation
    Text (large): Sudah berapa lama kamu jualan?
    Selection: {{Duration range}}
}

Slide 7:
{
    Topic: 2. Getting to know you,
    Objective: Get basic information of the user to understand their current situation
    Text (large): Apa barang/jasa yang kamu {{rencana akan, if Slide 5 is No}} jual?
    Selection dropdown: {{List of product categories}}
}

Slide 8 (chapter header):
{
    Topic: 3. How we help (fees)
    Objective: Summarise topic 2 and greet before walking though how we realise the benefits
    Text (large): Hi {{Name}}! 👋
    Text (smaller): {{Combination of responses to Slide 5-7, e.g. for Slide 5 No: Selamat, kamu sudah berani mengambil langkah awal untuk sukses! Kalau kamu mulai dengan cepat dan untung did tiap transaksi, e-Talase pas banget buat kamu. }}
    Text (medium): Gini caranya kami bantu kamu...
}

Slide 9:
{
    Topic: 3. How we help (fees)
    Objective: Get top product that the seller is selling
    Text (large, if Slide 5 Yes): Produk apa yang saat ini paling laku di toko kamu?
    Text (large, if Slide 5 No): Produk apa yang mau kamu rencana kamu jual?
    Text Input: {{Product name}}
    Selection dropdown: {{List of product categories, pre-filled with selection from Slide 7}}
}

Slide 10:
{
    Topic: 3. How we help (fees)
    Objective: Get revenue generated from the top product that the seller is selling
    Text (large): Berapa kira-kira penjualan kamu dari produk tersebut per bulannya? dan berapa harganya?
    Value Input: Rp {{Product revenue}}
    Value Input: Rp {{Product price}}
}

Slide 11 (only if Slide 5 Yes):
{
    Topic: 3. How we help (fees)
    Objective: Current seller setup in Toko Oren
    Text (large): {{Please suggest, asking the seller type and service fee from Toko Oren}}
    Selection: Regular, Star, Mall
    Toggle on/off: Gratis Ongkir XTRA, Promo XTRA
}

Slide 12 (only if Slide 5 Yes):
{
    Topic: 3. How we help (fees)
    Objective: Current seller setup in Toko Ijo
    Text (large): {{Please suggest, asking the seller type and service fee from Toko Ijo}}
    Selection: Marketplace, Official store
    Toggle on/off: Pre-order
}

Slide 13:
{
    Topic: 3. How we help (fees)
    Objective: Fee estimation of the top product
    Text (large): Segini kira-kira _minimal_ potongan penjualan kamu kalau jualan {{Product Name}} di marketplace
    Content: {{summary of admin fee monthly and per unit for both Toko Oren and Toko Ijo from fee calculator (current app) based on answers in Slide 10-12, shown in Table, for Slide 5 No, use the most basic option for Slide 11 and 12 answers}}
    Text (medium): Fee jualan di e-Talase? **Tentu saja 0%!**
}

Slide 14:
{
    Topic: 3. How we help (fees)
    Objective: Paywall disclaimer, gift present to seller
    Text (large): Well, kami harus jujur... 🙏
    Text (smaller): 
    Fee 0% e-Talase cuma buat yang berlangganan...
    {{If the Lowest monthly admin fee from Slide 13 >= 250000}}
    Tapi **{{Lowest admin fee from Slide 13}} itu udah lebih mahal** dari paket Starter kami!

    {{If the Lowest monthly admin fee from Slide 13 < 250000}}
    Kami memang ada biaya transaksi untuk FREE plan, tapi cuma Rp2500 **_flat_**!
    Dan dari simulasi kami, ini setara fee untuk produk senilai Rp25.000 saja~

    Text (medium): Dan sesuai janji, kami langsung tambah Rp25.000 credit ke akun kamu, kalau kamu sudah login 👍

    Options, at the bottom:
    Buka toko sekarang! {{Redirect to dashboard, close questionnaire}}
    Ada fitur apa lagi? {{Continue to Slide 15}}

    Backend action: {{add 25k to user account (regardless owner or not). Make sure this only happen once per user}}
}

Slide 15:
{
    Topic: 4. How we help (order-link)
    Objective: Introduce order link feature to new user.
    {{Generate content yourself}}
}

Slide 16:
{
    Topic: 4. How we help (order-link)
    Objective: Use-case 1: chat with long-term customer, repeat order directly via link shared in chat
    {{Generate content yourself, add illustration/screenshot. Add placeholder if you need me to add the screenshot}}
}

Slide 17:
{
    Topic: 4. How we help (order-link)
    Objective: Use-case 2: cooking video, the link attached in the description for customer to buy all of the ingredients used in video from the store
    {{Generate content yourself, add illustration/screenshot. Add placeholder if you need me to add the screenshot}}
}

Slide 18:
{
    Topic: 5. How we help (product and stock management)
    Objective: Sneak peek of the product and stock dashboard and its capabilities. Value: alert products low on stock, change prodict price and promo in mobile app
    {{Generate content yourself, add illustration/screenshot. Add placeholder if you need me to add the screenshot}}
}

Slide 18:
{
    Topic: 5. How we help (product and stock management)
    Objective: Sneak peek of the shipment dashboard and its capabilities. Value: shipping label created, separate access for shipment handler, shipment tracking
    {{Generate content yourself, add illustration/screenshot. Add placeholder if you need me to add the screenshot}}
}

Slide 19:
{
    Topic: 6. Conclusion
    Objective: End of onboarding, redirect to billing page to open store, or redirect to contact us for consultation.
    {{Generate content yourself. Action button at the bottom to redirect}}
}
