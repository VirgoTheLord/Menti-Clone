import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Quiz = () => {
  const { id: roomCode } = useParams();
  const [qid, setQid] = useState(1);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const fetchQuestion = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/fetch-question/${qid}`
      );
      setQuestion(res.data);
      setSelectedAnswer("");
      setShowResult(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setQuizCompleted(true);
      } else {
        console.error("Error fetching question:", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      alert("Please select an answer.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/quiz/submit-answer",
        {
          answer: selectedAnswer,
          qid,
        }
      );

      setResult(res.data);
      setShowResult(true);

      setTimeout(() => {
        setQid((prev) => prev + 1);
      }, 2000);
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert("Error submitting your answer. Please try again.");
    }
  };

  useEffect(() => {
    if (!quizCompleted) {
      fetchQuestion();
    }
  }, [qid]);

  if (quizCompleted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Quiz Completed</h1>
      </div>
    );
  }

  if (!question) return <div>Loading question...</div>;

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Room: {roomCode}</h1>
        </div>

        <h2 className="text-xl font-semibold mb-4">Question {qid}</h2>
        <p className="text-lg mb-6">{question.text}</p>

        <div className="space-y-4 mb-6">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer ${
                selectedAnswer === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={selectedAnswer === option.id}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedAnswer === option.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {selectedAnswer === option.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span>
                {option.id.toUpperCase()}. {option.text}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleSubmit}
            disabled={showResult}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-md"
          >
            Submit Answer
          </button>

          {showResult && result && (
            <p className="text-lg font-bold text-center">{result.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
