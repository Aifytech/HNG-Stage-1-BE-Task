const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { fetchExternalData } = require("../services/externalApis");
const { getAgeGroup, getTopCountry } = require("../utils/classification");
const { get, all, run } = require("../db/db");

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name",
      });
    }

    const lowerName = name.toLowerCase();

    const existing = await get("SELECT * FROM profiles WHERE name = ?", [
      lowerName,
    ]);

    if (existing) {
      return res.status(201).json({
        status: "success",
        message: "Profile already exists",
        data: existing,
      });
    }

    const { gender, age, nationality } = await fetchExternalData(lowerName);

    if (!gender.gender || gender.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response",
      });
    }

    if (age.age === null) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response",
      });
    }

    if (!nationality || !Array.isArray(nationality.country)) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response",
      });
    }

    const topCountry = getTopCountry(nationality.country);

    if (!topCountry) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response",
      });
    }

    const profile = {
      id: uuidv4(),
      name: lowerName,
      gender: gender.gender,
      gender_probability: gender.probability,
      sample_size: gender.count,
      age: age.age,
      age_group: getAgeGroup(age.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date().toISOString(),
    };

    await run(
      `INSERT INTO profiles (
        id, name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.gender,
        profile.gender_probability,
        profile.sample_size,
        profile.age,
        profile.age_group,
        profile.country_id,
        profile.country_probability,
        profile.created_at,
      ],
    );

    return res.status(201).json({
      status: "success",
      data: profile,
    });
  } catch (err) {
    console.error("Full Error:", err);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

router.get("/:id", async (req, res) => {
  const profile = await get("SELECT * FROM profiles WHERE id = ?", [
    req.params.id,
  ]);

  if (!profile) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  res.json({
    status: "success",
    data: profile,
  });
});

router.get("/", async (req, res) => {
  const { gender, country_id, age_group } = req.query;
  let query = "SELECT * FROM profiles WHERE 1=1";
  const params = [];

  if (gender) {
    query += "  AND LOWER(gender) = ?";
    params.push(gender.toLowerCase());
  }

  if (country_id) {
    query += " AND LOWER(country_id) = ?";
    params.push(country_id.loLowerCase());
  }

  if (age_group) {
    query += " AND LOWER(age_group) = ?";
    params.push(age_group.toLowerCase());
  }

  const rows = await all(query, params);

  res.json({
    status: "success",
    count: rows.length,
    data: rows,
  });
});

router.delete("/:id", async (req, res) => {
  const result = await run("DELETE FROM profiles WHERE id = ?", [
    req.params.id,
  ]);

  if (result.changes === 0) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  res.status(204).send();
});

module.exports = router;
