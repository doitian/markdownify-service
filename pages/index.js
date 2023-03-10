import { useRef } from "react";
import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";

const ENDPOINT = "/api/markdownify";

export default function Home() {
  const preElement = useRef();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = {
      url: event.target.url.value,
      html: event.target.html.value,
      includingMetadata: true,
    };

    // Form the request for sending data to the server.
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    preElement.current.innerText = "…";

    try {
      // Send the form data to our forms API on Vercel and get a response.
      const response = await fetch(ENDPOINT, options);

      // Get the response data from server as JSON.
      // If server returns the name submitted, that means the form works.
      const { text } = await response.json();
      preElement.current.innerText = text;
    } catch (ex) {
      preElement.current.innerText = `Error: ${ex}`;
    }
  };

  return (
    <>
      <Head>
        <title>Markdownify</title>
        <meta name="description" content="Convert HTML to Markdown" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1>Markdownify</h1>

        <form
          className={styles.container}
          action={ENDPOINT}
          onSubmit={handleSubmit}
          method="post"
        >
          <div className={styles.row}>
            <label for="url">URL:</label>
            <input type="text" id="url" name="url" required />
          </div>

          <div className={styles.row}>
            <label for="html">HTML:</label>
            <textarea rows="6" id="html" name="html"></textarea>
          </div>

          <div className={`${styles.row} ${styles.textRight}`}>
            <button type="submit">Submit</button>
          </div>
        </form>

        <pre ref={preElement}></pre>
      </main>
    </>
  );
}
