# Product Plan: Synthetic Data for Factory Production Anomalies

## 1. The Problem: The "Cold Start" of Quality Control

Modern manufacturing lines rely heavily on automated visual inspection (AVI) systems to detect defects (scratches, dents, misalignments, foreign objects). However, training these AI models presents a fundamental paradox:

*   **Defects are Rare:** In a well-tuned production line, defects might occur in only 0.1% or 0.01% of units. To train a robust deep learning model, you need thousands of examples of *each* defect type. Collecting this data from the physical line can take months or years.
*   **New Products have NO Data:** When launching a new product (NPI - New Product Introduction), there is zero historical data on defects. Manufacturers often have to run the line with manual inspection or subpar heuristics until enough bad parts are produced to train a model.
*   **The "Long Tail" of Anomalies:** Common defects are easy to catch, but the "long tail" of rare, weird, or environmental anomalies (e.g., a specific lighting glare, a new type of debris) constantly causes false negatives or false positives.

**Impact:**
*   High scrap rates during ramp-up.
*   Risk of escaping defects reaching customers.
*   High labor cost for manual inspection redundancy.
*   Slow iteration cycles for new product launches.

## 2. How It Is Solved Today (The Status Quo)

Currently, manufacturers use a mix of suboptimal strategies to deal with the lack of defect data:

### A. Manual Inspection & Rule-Based CV
*   **Method:** Humans inspect parts visually, or engineers write rigid "if-then" rules (e.g., "if blob size > 5px, reject").
*   **Drawback:** Humans fatigue and are inconsistent. Rule-based systems are brittle—a slight change in lighting or part positioning breaks the rule.

### B. Physical Defect Creation ("Golden Samples" vs. "Red Rabbits")
*   **Method:** Engineers physically damage good parts (scratching them with knives, denting them) to create "Red Rabbits" (bad samples) to calibrate the system.
*   **Drawback:** Destructive, expensive, and limited. You can't manually recreate every possible angle, depth, or type of defect. It biases the model to "artificial" looking defects.

### C. Anomaly Detection (Unsupervised Learning)
*   **Method:** Train a model only on "Good" images (which are plentiful) and flag anything that deviates as an anomaly.
*   **Drawback:** High False Positive Rate. It flags *any* change (e.g., dust, slight color shift, acceptable tolerance) as a defect. It lacks semantic understanding of *what* the defect is.

### D. Slow Ramp-Up
*   **Method:** Run the line, collect data for 3 months, label it, train the model, redeploy.
*   **Drawback:** The line runs unprotected or with high manual cost for those 3 months.

## 3. The Solution: Generative Synthetic Data

Synthetic data generation flips the paradigm: instead of *waiting* for defects to happen, we *create* them photorealistically in software.

### How It Helps

#### 1. Zero-Shot Cold Start
*   **Benefit:** Before the physical line even turns on, we can generate 10,000 images of the new product with every conceivable defect type (scratches, cracks, missing screws).
*   **Result:** The AI model launches with >90% accuracy on Day 1, not Month 3.

#### 2. Infinite Variability (Data Augmentation on Steroids)
*   **Benefit:** We can vary lighting, camera angles, background noise, and defect severity programmatically.
*   **Result:** The model becomes robust to environmental changes that usually break CV systems. We can simulate "edge cases" that might happen once a year.

#### 3. Precise Ground Truth (Perfect Labeling)
*   **Benefit:** Real-world data often has ambiguous or noisy labels (human error). Synthetic data comes with pixel-perfect segmentation masks automatically.
*   **Result:** Better training signal for the model, enabling detection of subtler defects.

#### 4. Privacy & IP Security
*   **Benefit:** If working with sensitive designs, synthetic data allows training without exposing real photos of the unreleased product to third-party labelers.

### Core Value Proposition
**"Train on the defects you haven't seen yet."**
Reduce NPI (New Product Introduction) ramp-up time for quality control from months to days, while achieving higher accuracy than human inspection.

## 4. Key Differentiator: Defect Sculpting & Blueprints (Powered by GEPA)

Standard synthetic data tools often generate "random" noise or generic defects. Our tool introduces **Defect Sculpting**, allowing engineers to precisely define and evolve defect characteristics using **GEPA (Genetic-Pareto)** prompt optimization.

### The Concept: Defect Blueprints
A "Blueprint" is a semantic definition of a specific defect type (e.g., "Hairline Fracture on Ceramic"). Instead of just a label, it captures the *physics* and *visuals* of the defect.
*   **Components:** Text description, constraint parameters (depth, width, rust level), and reference images.
*   **Role:** Acts as the "seed" for the generative model.

### The Workflow: Sculpting with GEPA
We use **GEPA (Genetic-Pareto)** to automate the "prompt engineering" required to generate hyper-realistic defects that match the Blueprint.

1.  **Initial Prompting:** The user describes the defect (e.g., "Deep scratch with metallic burrs").
2.  **Evolutionary Generation:** GEPA generates a population of prompts and resulting images.
3.  **Selection Mechanism:**
    *   **Automated:** A discriminator model scores images against the Blueprint constraints.
    *   **Human-in-the-Loop:** The engineer selects the "best" defects from a lineup (like an optometrist test: "Better 1 or Better 2?").
4.  **Optimization:** GEPA uses the selected "winners" to mutate and evolve the prompts, converging on a "Perfect Prompt" that consistently yields high-quality, diverse examples of that specific defect.

### Value Add
*   **Fine-Grained Control:** Move beyond "scratch" to "3mm oxidized scratch on curved surface."
*   **Rapid Iteration:** "Sculpt" a new defect type in minutes by simply selecting the best looking examples, without needing to know how to prompt engineer.

## 5. Technical Architecture

### High-Level Stack
*   **Frontend:** React (Vite) + TailwindCSS for the "Defect Sculpting" UI.
*   **Backend:** Python (FastAPI) or Node.js for API orchestration.
*   **Database:** PostgreSQL for persistent storage of Blueprints, Jobs, and Selections.
*   **AI Engine:** `fal.ai` for asynchronous image generation (FLUX/Stable Diffusion).

### Async Generation Pipeline
We utilize `fal.ai`'s async API to handle the heavy lifting of image generation.
1.  **Job Submission:** User requests are queued via `fal_client.submit_async`.
2.  **State Management:** Jobs are tracked in Postgres with status updates via Webhooks.
3.  **Data Lineage:** Every generated image is linked back to its specific Prompt and Blueprint version, enabling full traceability.

*See [technical_spec_fal.md](technical_spec_fal.md) for the detailed API specification and data models.*
