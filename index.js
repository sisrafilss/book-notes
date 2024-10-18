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

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM notes");
    res.render("index", {
      books: result.rows,
    });
  } catch (err) {
    console.error(err);
  }
});

app.get("/manage-notes", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM notes");
    res.render("manageNotes", {
      books: result.rows,
    });
  } catch (err) {
    console.error(err);
  }
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
          book.author?.length ? book.author.join(",") : "",
          book.description,
          book.thumbnail,
          recommendation,
          readingDate,
          book.notes,
        ]
      );

      if (response.rowCount) {
        res.render("noteAddedSuccess");
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
