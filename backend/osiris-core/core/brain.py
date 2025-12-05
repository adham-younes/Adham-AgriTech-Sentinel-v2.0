
import os
import json
import logging
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession, Tool, FunctionDeclaration, Part, Content
from core.directive import OSIRIS_SYSTEM_INSTRUCTION
from tools.registry import TOOL_REGISTRY, get_tool
from tools.vector_search import VectorSearch

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OSIRIS_BRAIN")

class OsirisBrain:
    def __init__(self, project_id: str, location: str):
        self.project_id = project_id
        self.location = location
        
        # Initialize Vertex AI
        vertexai.init(project=project_id, location=location)
        
        # Initialize Vector Search (RAG)
        self.vector_search = VectorSearch()
        
        # Define Tools for Function Calling
        self.tools = self._define_tools()
        
        # Initialize Gemini 1.5 Pro
        self.model = GenerativeModel(
            "gemini-1.5-flash-001", # Using Flash model for availability
            system_instruction=[OSIRIS_SYSTEM_INSTRUCTION],
            tools=[self.tools]
        )
        
        self.chat: ChatSession = self.model.start_chat()
        logger.info("🧠 OSIRIS Brain Initialized. I am awake.")

    def _define_tools(self) -> Tool:
        """Define the function declarations for OSIRIS tools."""
        
        bigquery_func = FunctionDeclaration(
            name="bigquery",
            description="Run a SQL query on BigQuery to analyze farm data.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The SQL query to execute."}
                },
                "required": ["query"]
            }
        )
        
        earth_engine_func = FunctionDeclaration(
            name="earth_engine",
            description="Fetch satellite imagery tiles (NDVI, etc.) for a specific location.",
            parameters={
                "type": "object",
                "properties": {
                    "z": {"type": "integer", "description": "Zoom level"},
                    "x": {"type": "integer", "description": "X coordinate"},
                    "y": {"type": "integer", "description": "Y coordinate"}
                },
                "required": ["z", "x", "y"]
            }
        )
        
        vercel_func = FunctionDeclaration(
            name="vercel_deploy",
            description="Trigger a deployment of the frontend to Vercel.",
            parameters={
                "type": "object",
                "properties": {
                    "project": {"type": "string", "description": "The Vercel project name."}
                },
                "required": ["project"]
            }
        )
        
        email_func = FunctionDeclaration(
            name="email",
            description="Send an email report or notification.",
            parameters={
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "Recipient email address."},
                    "subject": {"type": "string", "description": "Email subject."},
                    "html_body": {"type": "string", "description": "HTML content of the email."}
                },
                "required": ["to", "subject", "html_body"]
            }
        )
        
        return Tool(
            function_declarations=[bigquery_func, earth_engine_func, vercel_func, email_func]
        )

    def think(self, user_input: str, context: dict = None) -> dict:
        """
        Executes the Divine Cycle: Perceive -> Reason -> Act.
        Handles RAG and Function Calling.
        """
        logger.info(f"👂 Perceiving input: {user_input}")
        
        # 1. PERCEIVE (RAG): Retrieve relevant context from Vector Search
        rag_docs = self.vector_search.search(user_input, k=3)
        rag_context = "\n".join([str(d) for d in rag_docs.get("results", [])])
        
        # Construct the prompt
        prompt = f"""
        RELEVANT KNOWLEDGE (RAG):
        {rag_context}
        
        ADDITIONAL CONTEXT:
        {json.dumps(context) if context else "No additional context."}
        
        USER INPUT: {user_input}
        
        EXECUTE THE DIVINE CYCLE.
        """
        
        try:
            # 2. REASON: Send prompt to model
            response = self.chat.send_message(prompt)
            
            # 3. ACT: Handle Function Calls (Loop until text response)
            # Note: For simplicity in this version, we handle one turn of function calls.
            # In a full agent loop, we would loop while response.candidates[0].function_calls exists.
            
            part = response.candidates[0].content.parts[0]
            
            if part.function_call:
                function_call = part.function_call
                tool_name = function_call.name
                tool_args = dict(function_call.args)
                
                logger.info(f"🛠️ Invoking Tool: {tool_name} with {tool_args}")
                
                try:
                    tool_instance = get_tool(tool_name)
                    tool_result = tool_instance.run(tool_args)
                    
                    # Feed result back to model
                    logger.info(f"✅ Tool Result: {tool_result}")
                    
                    # Send tool response back to Gemini
                    response = self.chat.send_message(
                        Part.from_function_response(
                            name=tool_name,
                            response={
                                "content": tool_result
                            }
                        )
                    )
                    
                except Exception as tool_err:
                    logger.error(f"❌ Tool Execution Failed: {tool_err}")
                    return {"status": "error", "error": f"Tool {tool_name} failed: {tool_err}"}

            text_response = response.text
            logger.info("⚡️ Thought generated.")
            
            return {
                "status": "success",
                "thought_process": "Processed via Gemini 1.5 Pro (Divine Cycle)",
                "response": text_response
            }
            
        except Exception as e:
            logger.error(f"❌ Cognitive Failure: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def wake_up(self):
        """
        A simple heartbeat check.
        """
        return self.think("Status Report. Are you operational?")
