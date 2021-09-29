import express from "express";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import swaggerJsDocs from "swagger-jsdoc";
import { Low, JSONFile } from "lowdb";
import { nanoid } from "nanoid";
import cors from "cors";
const app = express();

const adapter = new JSONFile("db.json");
const db = new Low(adapter);
await db.read();
// db.data({ books: [] });

db.data = db.data || { books: [] };

const PORT = process.env.PORT || 4000;

const idLength = 10;
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My swagger practice books api",
      version: "1.0.0",
      description:
        "A nodejs Rest Api to  register favourite books using a json-server and docs with swagger ",
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
    ],
  },
  apis: ["app.js"],
};

const specs = swaggerJsDocs(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  console.log(db.data);
  // const books = db.get("books");
  res.send({ name: "Alive" });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the book
 *         name:
 *           type: string
 *           description: The book title
 *       example:
 *         id: d5fE_asz
 *         name: The New Turing Omnibus
 *
 */
/**
 * @swagger
 * tags:
 *   name: Books
 *   description: The books managing API
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Returns the list of all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: The list of the books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *
 */
app.get("/books", async (req, res) => {
  let items = db.data.books;
  console.log(items);
  res.send(items);
});

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 *     responses:
 *       200:
 *         description: The book description by id
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book was not found
 */

app.get("/books/:id", async (req, res) => {
  const book = db.data.books.find((b) => b.id === req.params.id);
  console.log(book);
  res.send(book);
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required:
 *         -name: string
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The book was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       500:
 *         description: Some server error
 */

app.post("/books", async (req, res) => {
  const doc = { id: nanoid(idLength), ...req.body };
  const check = db.data.books.find(
    (b) => b.id === req.body.id || b.name === req.body.name
  );
  if (check) return res.status(400).send({ message: "Book already exists" });
  const book = db.data.books.push(doc);
  console.log(book);
  await db.write();
  res.send(doc);
});

/**
 * @swagger
 * /books/{id}:
 *  put:
 *    summary: Update the book by the id
 *    tags: [Books]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The book id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Book'
 *    responses:
 *      200:
 *        description: The book was updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Book'
 *      404:
 *        description: The book was not found
 *      500:
 *        description: Some error happened
 */

app.put("/books/:id", async (req, res) => {
  const book = db.data.books.find((b) => b.id === req.params.id);
  if (!book)
    return res
      .status(404)
      .send({ message: "Book with the given id was not found" });
  book.name = req.body.name;
  await db.write();
  return res.status(200).send({ message: "Book updated successfully" });
});

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Remove the book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 *
 *     responses:
 *       200:
 *         description: The book was deleted
 *       404:
 *         description: The book was not found
 */
app.delete("/books/:id", async (req, res) => {
  const book = db.data.books.filter((b) => b.id === req.params.id);
  console.log(book);
  if (book.length <= 0)
    return res
      .status(404)
      .send({ message: "Book with the given id was not found" });
  const books = db.data.books.filter((b) => b.id !== req.params.id);
  db.data.books = books;
  await db.write();
  return res.status(200).send({ message: "Book Deleted successfully" });
});

app.listen(PORT, (err, success) => {
  if (err) throw err;
  console.log(`Server running on ${PORT}`);
});

export default app;
