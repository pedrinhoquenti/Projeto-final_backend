const express = require("express")
const app = express()
app.use(express.json())
const port = 3000
const db = require("./db")

// ========== ROTAS DE AULA ==========

// GET /aula - lista todas as aulas
app.get("/aula", async (req, res) => {
    try {
        const resultado = await db.pool.query("SELECT * FROM aula")
        res.status(200).json(resultado[0])
    } catch (erro) {
        res.status(500).json({ erro: erro.message })
    }
})

// POST /aula - cadastra uma nova aula
app.post("/aula", async (req, res) => {
    try {
        const dados = req.body
        const resultado = await db.pool.query(
            "INSERT INTO aula (serie, turma, componente, professor) VALUES (?, ?, ?, ?)",
            [dados.serie, dados.turma, dados.componente, dados.professor]
        )
        res.status(201).json(
            { resultado: "Aula cadastrada, ID = " + resultado[0].insertId }
        )
    } catch (erro) {
        res.status(500).json({ erro: erro.message })
    }
})

// DELETE /aula/:id - apaga uma aula pelo id
app.delete("/aula/:id", async (req, res) => {
    try {
        const id = req.params.id
        const resultado = await db.pool.query(
            "DELETE FROM aula WHERE id = ?",
            [id]
        )

        if (resultado[0].affectedRows === 0) {
            return res.status(404).json({ erro: "Aula não encontrada" })
        }

        res.status(200).json({ resultado: "Aula excluída com sucesso" })
    } catch (erro) {
        if (erro.code === "ER_ROW_IS_REFERENCED_2" || erro.errno === 1451) {
            return res.status(400).json({
                erro: "Não é possível excluir esta aula porque ela está vinculada a um ou mais horários"
            })
        }
        res.status(500).json({ erro: erro.message })
    }
})

// ========== ROTAS DE HORÁRIO ==========

// POST /horario - cadastra um novo horário de aula
app.post("/horario", async (req, res) => {
    try {
        const dados = req.body

        // Verifica se a aula existe
        const [aula] = await db.pool.query(
            "SELECT id FROM aula WHERE id = ?",
            [dados.idaula]
        )

        if (aula.length === 0) {
            return res.status(400).json({
                erro: "Não é possível cadastrar o horário: a aula informada (idaula) não existe"
            })
        }

        const resultado = await db.pool.query(
            "INSERT INTO horario_aula (idaula, dia_semana, ordem) VALUES (?, ?, ?)",
            [dados.idaula, dados.dia_semana, dados.ordem]
        )

        res.status(201).json({
            resultado: "Horário cadastrado, ID = " + resultado[0].insertId
        })
    } catch (erro) {
        if (erro.code === "ER_NO_REFERENCED_ROW_2" || erro.errno === 1452) {
            return res.status(400).json({
                erro: "Não é possível cadastrar o horário: a aula informada (idaula) não existe"
            })
        }
        res.status(500).json({ erro: erro.message })
    }
})

// GET /horario/:dia - lista os horários de um dia da semana
app.get("/horario/:dia", async (req, res) => {
    try {
        const dia = req.params.dia
        const resultado = await db.pool.query(
            `SELECT h.id, h.idaula, h.dia_semana, h.ordem, 
                    a.serie, a.turma, a.componente, a.professor
             FROM horario_aula h
             INNER JOIN aula a ON a.id = h.idaula
             WHERE h.dia_semana = ?
             ORDER BY h.ordem`,
            [dia]
        )
        res.status(200).json(resultado[0])
    } catch (erro) {
        res.status(500).json({ erro: erro.message })
    }
})

// DELETE /horario/:id - apaga um horário pelo id
app.delete("/horario/:id", async (req, res) => {
    try {
        const id = req.params.id
        const resultado = await db.pool.query(
            "DELETE FROM horario_aula WHERE id = ?",
            [id]
        )

        if (resultado[0].affectedRows === 0) {
            return res.status(404).json({ erro: "Horário não encontrado" })
        }

        res.status(200).json({ resultado: "Horário excluído com sucesso" })
    } catch (erro) {
        res.status(500).json({ erro: erro.message })
    }
})

app.listen(port, () => {
    console.log("API rodando na porta " + port)
})