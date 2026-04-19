const express = require("express");
const router = express.Router();
const { v7: uuidv7 } = require("uuid");
const { fetchExternalData } = require("../services/externalApis");
const { getAgeGroup, getTopCountry } = require("../utils/classification");
const Profile = require("../models/Profile");

const serialize = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    name: obj.name,
    gender: obj.gender,
    gender_probability: obj.gender_probability,
    sample_size: obj.sample_size,
    age: obj.age,
    age_group: obj.age_group,
    country_id: obj.country_id,
    country_probability: obj.country_probability,
    created_at: obj.created_at,
  };
};

const serializeList = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    name: obj.name,
    gender: obj.gender,
    age: obj.age,
    age_group: obj.age_group,
    country_id: obj.country_id,
  };
};

router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!("name" in body) || body.name === null || body.name === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name",
      });
    }

    if (typeof body.name !== "string") {
      return res.status(422).json({
        status: "error",
        message: "Invalid type",
      });
    }

    const trimmed = body.name.trim();
    if (trimmed === "") {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty name",
      });
    }

    const lowerName = trimmed.toLowerCase();

    const existing = await Profile.findOne({ name: lowerName }).lean();
    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: serialize(existing),
      });
    }

    let external;
    try {
      external = await fetchExternalData(lowerName);
    } catch (err) {
      return res.status(502).json({
        status: "error",
        message: "Upstream API request failed",
      });
    }

    const { gender, age, nationality } = external;

    if (!gender || !gender.gender || gender.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response",
      });
    }

    if (!age || age.age === null || age.age === undefined) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response",
      });
    }

    if (!nationality || !Array.isArray(nationality.country) || nationality.country.length === 0) {
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

    const doc = {
      _id: uuidv7(),
      name: lowerName,
      gender: gender.gender,
      gender_probability: gender.probability,
      sample_size: gender.count,
      age: age.age,
      age_group: getAgeGroup(age.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
      created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    };

    try {
      const created = await Profile.create(doc);
      return res.status(201).json({
        status: "success",
        data: serialize(created),
      });
    } catch (err) {
      // Race on the unique name index — fetch and return the existing row.
      if (err && err.code === 11000) {
        const raced = await Profile.findOne({ name: lowerName }).lean();
        if (raced) {
          return res.status(200).json({
            status: "success",
            message: "Profile already exists",
            data: serialize(raced),
          });
        }
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { gender, country_id, age_group } = req.query;
    const filter = {};

    if (typeof gender === "string" && gender.length) {
      filter.gender = new RegExp(`^${escapeRegex(gender)}$`, "i");
    }
    if (typeof country_id === "string" && country_id.length) {
      filter.country_id = new RegExp(`^${escapeRegex(country_id)}$`, "i");
    }
    if (typeof age_group === "string" && age_group.length) {
      filter.age_group = new RegExp(`^${escapeRegex(age_group)}$`, "i");
    }

    const rows = await Profile.find(filter).lean();
    return res.json({
      status: "success",
      count: rows.length,
      data: rows.map(serializeList),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id).lean();
    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }
    return res.json({
      status: "success",
      data: serialize(profile),
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await Profile.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
