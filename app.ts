import puppeteer from "puppeteer";
import dotenv from "dotenv";
import cheerio from "cheerio";
import readline from "readline";

dotenv.config();

const crawler = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 60000,
  });
  const email = process.env.EMAIL as string;
  const password = process.env.PASSWORD as string;
  if (!email || !password) {
    console.log("Please set EMAIL and PASSWORD in .env file");
    return;
  }
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 800,
  });

  // login process
  await page.goto("https://programmers.co.kr/users/login");
  const emailTag = (await page.$("#user_email")) as puppeteer.ElementHandle;
  await emailTag.type(email);
  const passwordTag = (await page.$(
    "#user_password"
  )) as puppeteer.ElementHandle;
  await passwordTag.type(password);
  await page.click("#btn-sign-in");

  // go to resumes page & parse resume list
  await page.waitForTimeout(1000);
  await page.goto("https://programmers.co.kr/resumes");
  //
  let resumes = await page.$$eval(
    "body > div.main > div.container > table > tbody > tr.resume-item > td.t-body > h5 > a",
    (elements) => {
      return elements.map((element) => {
        const refinedElement = element as HTMLLinkElement;
        return {
          title: refinedElement.innerText,
          url: refinedElement.href,
        };
      });
    }
  );
  if (resumes.length === 0) {
    console.log("no resume found");
    return;
  }
  // print resume list to console
  resumes.map((resume, idx) => {
    console.log(`${idx + 1}. ${resume.title}`);
  });
  // create readline ineterface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  // get user input
  rl.question("Select resume number to convert: ", async (answer) => {
    // get resume url
    const resume = resumes[parseInt(answer) - 1];
    // go to resume page
    await page.goto(resume.url);
    await page.waitForTimeout(1000);
    // click preview button
    await page.click(
      "#resume-display > div > div > div > div > button:nth-child(1)"
    );
    await page.waitForTimeout(2000);
    // click print button
    // returns null for now
    let printBtn = (await page.evaluate(() => {
      return document.querySelector(".btn-view-print");
    })) as HTMLButtonElement;
    // console.log(printBtn);
    // await printBtn.click();
    // await page.waitForTimeout(1000);
    // select print option
    rl.close();
  });

  // await page.close();
  // await browser.close();
};

crawler();
