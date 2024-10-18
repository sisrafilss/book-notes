import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Create a new PostgreSQL client instance
const db = new pg.Client({
  user: "postgres",
  password: "123456",
  host: "localhost",
  port: 5432,
  database: "book-notes",
});
await db.connect();

// Set the view engine to EJS
app.set("view engine", "ejs");

const API_URL = "https://www.googleapis.com/books/v1/volumes";

app.get("/", (req, res) => {
  res.render("index", {
    books: books,
  });
});

app.get("/write-note", async (req, res) => {
  res.render("searchBooks");
});

app.post("/search-books", async (req, res) => {
  const searchText = req.body.searchText;
  const embededSearchText = searchText.replace(/\s+/g, "+");
  const books = [];
  try {
    const result = await axios.get(
      `${API_URL}?q=${embededSearchText}&key=${process.env.API_KEY}`
    );
    result.data.items.forEach((item) => {
      const book = {
        id: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors,
        description: item.volumeInfo.description,
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
      };
      books.push(book);
    });
    res.render("searchBooks", { books: books });
    // console.log(books[0]);
  } catch (err) {
    console.log(err);
  }
});

app.post("/write-note", async (req, res) => {
  const bookId = req.body.bookId;
  try {
    const result = await axios.get(`${API_URL}/${bookId}`);
    const item = result.data;
    const book = {
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
    };
    // console.log(result.data);
    res.render("writeNote", { book: book });
  } catch (err) {
    console.log(err);
  }

  // res.render('')
});

app.post("/submit-notes", async (req, res) => {
  const notes = req.body.notes;
  const recommendation = req.body.recommendation;
  const readingDate = req.body.readingDate;
  const bookId = req.body.bookId;
  try {
    const result = await axios.get(`${API_URL}/${bookId}`);
    const item = result.data;
    const book = {
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
      notes,
      recommendation,
      readingDate,
    };

    try {
      const response = await db.query(
        "INSERT INTO notes (book_id, title, author, description, thumbnail, recommendation, reading_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          book.id,
          book.title,
          book.author?.length ? book.author.join(",") : '',
          book.description,
          book.thumbnail,
          recommendation,
          readingDate,
          book.notes,
        ]
      );

      if (response.rowCount) {
        res.render('noteAddedSuccess');
      }
      
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`App running on port: ${port}`);
});

const books = [
  {
    cover:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg",
    title: "Atomic Habits",
    dateRead: "September 12, 2024",
    recommendation: 9,
    review:
      "Atomic Habits by James Clear offers a comprehensive guide to understanding how small, incremental changes in habits can lead to significant, positive transformations in life. The book is packed with practical strategies for building good habits and breaking bad ones, all backed by scientific research. Clear’s writing is engaging and the methods are easy to apply, making it a must-read for anyone seeking to improve their life in meaningful ways.",
  },
  {
    cover:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg",
    title: "The Alchemist",
    dateRead: "August 15, 2024",
    recommendation: 8,
    review:
      "The Alchemist by Paulo Coelho is a timeless fable about following your dreams and listening to your heart. The story follows a young shepherd named Santiago on a journey to find treasure, but it’s also an exploration of self-discovery. Coelho’s poetic writing and spiritual insights make this book a delightful and inspirational read, even if some may find the message a bit too simplistic.",
  },
  {
    cover:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg",
    title: "Deep Work",
    dateRead: "July 22, 2024",
    recommendation: 10,
    review:
      "Cal Newport’s Deep Work emphasizes the importance of focused, uninterrupted work in achieving extraordinary results in a world full of distractions. Newport presents convincing arguments for why “deep work” is essential in today’s economy, along with actionable strategies for cultivating this valuable skill. This book is particularly relevant for professionals looking to increase their productivity and make a greater impact in their careers.",
  },
  {
    cover:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg",
    title: "Sapiens: A Brief History of Humankind",
    dateRead: "June 10, 2024",
    recommendation: 9,
    review:
      "Yuval Noah Harari’s Sapiens is a thought-provoking book that delves into the history of humankind, from the earliest days of Homo sapiens to the present. The book explores how biology, culture, and technology have shaped human societies. Harari’s engaging narrative style and ability to weave complex topics into a coherent and digestible story make this book an insightful read for anyone curious about human evolution and the forces that shape our world.",
  },
  {
    cover:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg",
    title: "Educated",
    dateRead: "May 5, 2024",
    recommendation: 9,
    review:
      "Educated by Tara Westover is a powerful memoir about a woman who grows up in a strict, survivalist family in rural Idaho and eventually escapes to pursue formal education. Westover’s journey from a childhood without schooling to earning a Ph.D. from Cambridge is both inspiring and heartbreaking. Her story is a testament to the transformative power of education and the strength of the human spirit in overcoming adversity.",
  },
];
