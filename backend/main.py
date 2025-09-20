from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict, deque
from dotenv import load_dotenv
import google.generativeai as genai
import os
from typing import Optional
import smtplib                          
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS")],
    allow_methods=[os.getenv("CORS_METHODS")],
    allow_headers=[os.getenv("CORS_HEADERS")]
)

@app.get(os.getenv("ROOT_ENDPOINT"))
def read_root():
    return {os.getenv("PING_KEY"): os.getenv("PING_RESPONSE")}

@app.post(os.getenv("PIPELINE_ENDPOINT"))
async def parse_pipeline(request: Request):
    data = await request.json()
    nodes = data.get(os.getenv("NODES_KEY"), [])
    edges = data.get(os.getenv("EDGES_KEY"), [])
    num_nodes = len(nodes)
    num_edges = len(edges)
    graph = defaultdict(list)
    indegree = defaultdict(int)
    
    for edge in edges:
        source = edge.get(os.getenv("SOURCE_KEY"))
        target = edge.get(os.getenv("TARGET_KEY"))
        if source and target:
            graph[source].append(target)
            indegree[target] += 1
    
    queue = deque([node[os.getenv("NODE_ID_KEY")] for node in nodes if indegree[node[os.getenv("NODE_ID_KEY")]] == 0])
    visited = 0
    
    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in graph[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    is_dag = visited == len(nodes)
    return {
        os.getenv("RESPONSE_NODES_KEY"): num_nodes,
        os.getenv("RESPONSE_EDGES_KEY"): num_edges,
        os.getenv("RESPONSE_DAG_KEY"): is_dag
    }

class PromptPayload(BaseModel):
    prompt: str
    personalApiKey: Optional[str] = None
    model: Optional[str] = os.getenv("DEFAULT_AI_MODEL")

class ReportRequest(BaseModel):
    reportType: str
    name: str = os.getenv("DEFAULT_USER_NAME")
    email: str
    description: str
    selectedNode: str = os.getenv("DEFAULT_NODE_VALUE")

@app.post(os.getenv("AI_ENDPOINT"))
async def generate_with_gemini(payload: PromptPayload):
    try:
        if payload.personalApiKey and payload.personalApiKey.strip():
            api_key = payload.personalApiKey.strip()
            min_key_len = int(os.getenv("MIN_API_KEY_LENGTH"))
            key_prefix = os.getenv("API_KEY_START_CHARS")
            if len(api_key) < min_key_len or not api_key.startswith(key_prefix):
                error_msg = os.getenv("INVALID_KEY_ERROR")
                raise HTTPException(status_code=400, detail={os.getenv("ERROR_WRAPPER_KEY"): {os.getenv("MESSAGE_KEY"): error_msg}})
        else:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                error_msg = os.getenv("NO_KEY_ERROR")
                raise HTTPException(status_code=500, detail={os.getenv("ERROR_WRAPPER_KEY"): {os.getenv("MESSAGE_KEY"): error_msg}})

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(payload.model or os.getenv("DEFAULT_AI_MODEL"))
        result = model.generate_content(payload.prompt)

        text_attribute = os.getenv("AI_TEXT_ATTR")
        output = getattr(result, text_attribute, None)
        response_attr = os.getenv("AI_RESPONSE_ATTR")
        if not output and hasattr(result, response_attr):
            output = getattr(result, response_attr).text()
        
        clean_prefix = os.getenv("CLEAN_PREFIX")
        clean_char1 = os.getenv("CLEAN_CHAR_1")
        clean_char2 = os.getenv("CLEAN_CHAR_2")
        cleaned = output.strip().lstrip(clean_prefix).replace(clean_char1, "").replace(clean_char2, "")
        print(cleaned)
        
        output_key = os.getenv("OUTPUT_FIELD_KEY")
        source_key = os.getenv("SOURCE_FIELD_KEY")
        personal_source = os.getenv("PERSONAL_SOURCE_NAME")
        backend_source = os.getenv("BACKEND_SOURCE_NAME")
        fallback_text = os.getenv("NO_OUTPUT_TEXT")
        
        return {
            output_key: cleaned or fallback_text, 
            source_key: personal_source if payload.personalApiKey else backend_source
        }

    except HTTPException:
        raise
    except Exception as e:
        error_check1 = os.getenv("API_ERROR_CHECK_1")
        error_check2 = os.getenv("API_ERROR_CHECK_2")
        
        if error_check1 in str(e) or error_check2 in str(e).lower():
            if payload.personalApiKey:
                personal_error = os.getenv("PERSONAL_KEY_ERROR")
                raise HTTPException(status_code=401, detail={os.getenv("ERROR_WRAPPER_KEY"): {os.getenv("MESSAGE_KEY"): personal_error}})
            else:
                backend_error = os.getenv("BACKEND_ERROR_TEXT")
                raise HTTPException(status_code=500, detail={os.getenv("ERROR_WRAPPER_KEY"): {os.getenv("MESSAGE_KEY"): backend_error}})
        
        generic_error_prefix = os.getenv("GENERIC_ERROR_PREFIX")
        raise HTTPException(status_code=500, detail={os.getenv("ERROR_WRAPPER_KEY"): {os.getenv("MESSAGE_KEY"): f"{generic_error_prefix}: {str(e)}"}})

@app.post(os.getenv("REPORT_ENDPOINT"))
async def submit_report(report: ReportRequest):
    try:
        EMAIL_CONFIG = {
            os.getenv("SMTP_SERVER_KEY"): os.getenv("MAIL_SERVER_HOST"),
            os.getenv("SMTP_PORT_KEY"): int(os.getenv("MAIL_SERVER_PORT")),
            os.getenv("EMAIL_KEY"): os.getenv("EMAIL_ADDRESS"),
            os.getenv("PASSWORD_KEY"): os.getenv("EMAIL_PASSWORD"),
            os.getenv("RECIPIENT_KEY"): os.getenv("RECIPIENT_EMAIL", os.getenv("FALLBACK_RECIPIENT"))
        }
        
        email_field = os.getenv("EMAIL_KEY")
        password_field = os.getenv("PASSWORD_KEY")
        if not EMAIL_CONFIG[email_field] or not EMAIL_CONFIG[password_field]:
            config_error = os.getenv("EMAIL_CONFIG_ERROR")
            error_field = os.getenv("ERROR_FIELD_NAME")
            raise HTTPException(status_code=500, detail={error_field: config_error})
        
        if not report.email or not report.description:
            validation_error = os.getenv("FIELD_VALIDATION_ERROR")
            error_field = os.getenv("ERROR_FIELD_NAME")
            raise HTTPException(status_code=400, detail={error_field: validation_error})
        
        time_format = os.getenv("TIMESTAMP_FORMAT_STRING")
        id_format = os.getenv("REPORT_ID_FORMAT_STRING")
        timestamp = datetime.now().strftime(time_format)
        report_id = datetime.now().strftime(id_format)
        
        subject_prefix = os.getenv("EMAIL_SUBJECT_START")
        subject = f"{subject_prefix} - {report.reportType.upper()}"
        
        primary_color = os.getenv("EMAIL_PRIMARY_COLOR")
        secondary_color = os.getenv("EMAIL_SECONDARY_COLOR")
        accent_color = os.getenv("EMAIL_ACCENT_COLOR")
        background_color = os.getenv("EMAIL_BACKGROUND_COLOR")
        light_gray = os.getenv("EMAIL_LIGHT_GRAY")
        border_color = os.getenv("EMAIL_BORDER_COLOR")
        text_color = os.getenv("EMAIL_TEXT_COLOR")
        muted_color = os.getenv("EMAIL_MUTED_COLOR")
        
        template_title = os.getenv("EMAIL_TEMPLATE_TITLE")
        template_subtitle = os.getenv("EMAIL_TEMPLATE_SUBTITLE")
        label_type = os.getenv("EMAIL_LABEL_TYPE")
        label_name = os.getenv("EMAIL_LABEL_NAME")
        label_email = os.getenv("EMAIL_LABEL_EMAIL")
        label_node = os.getenv("EMAIL_LABEL_NODE")
        label_time = os.getenv("EMAIL_LABEL_TIME")
        label_desc = os.getenv("EMAIL_LABEL_DESCRIPTION")
        button_text = os.getenv("EMAIL_BUTTON_TEXT")
        reply_prefix = os.getenv("EMAIL_REPLY_PREFIX")
        id_label = os.getenv("EMAIL_ID_LABEL")
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: {light_gray};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {light_gray};">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: {background_color}; max-width: 600px; border: 1px solid {border_color};">
                    <tr>
                        <td style="background-color: {primary_color}; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: {background_color}; font-size: 24px;">{template_title}</h1>
                            <p style="margin: 10px 0 0 0; color: {light_gray}; font-size: 14px;">{template_subtitle}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="color: {primary_color}; font-size: 18px; margin: 0 0 20px 0;">Report Details</h2>
                            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid {border_color};">
                                    <td style="font-weight: bold; color: {secondary_color}; width: 30%;">{label_type}:</td>
                                    <td style="color: {text_color};">{report.reportType.upper()}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid {border_color};">
                                    <td style="font-weight: bold; color: {secondary_color};">{label_name}:</td>
                                    <td style="color: {text_color};">{report.name}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid {border_color};">
                                    <td style="font-weight: bold; color: {secondary_color};">{label_email}:</td>
                                    <td><a href="mailto:{report.email}" style="color: {accent_color}; text-decoration: none;">{report.email}</a></td>
                                </tr>
                                <tr style="border-bottom: 1px solid {border_color};">
                                    <td style="font-weight: bold; color: {secondary_color};">{label_node}:</td>
                                    <td style="color: {text_color};">{report.selectedNode}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; color: {secondary_color};">{label_time}:</td>
                                    <td style="color: {text_color};">{timestamp}</td>
                                </tr>
                            </table>
                            <h3 style="color: {primary_color}; font-size: 16px; margin: 30px 0 15px 0;">{label_desc}</h3>
                            <div style="background-color: {light_gray}; padding: 20px; border-left: 4px solid {accent_color}; white-space: pre-wrap; color: {text_color}; line-height: 1.6;">{report.description}</div>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="mailto:{report.email}?subject={reply_prefix}: {report.reportType.upper()}" 
                                   style="background-color: {accent_color}; color: {background_color}; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">{button_text}</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: {light_gray}; padding: 20px; text-align: center; border-top: 1px solid {border_color};">
                            <p style="margin: 0; color: {muted_color}; font-size: 12px;">{id_label}: {report_id}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        plain_prefix = os.getenv("PLAIN_TEXT_PREFIX")
        plain_suffix = os.getenv("PLAIN_TEXT_SUFFIX")
        
        text_content = f"""
{plain_prefix} {plain_suffix}

{label_type}: {report.reportType.upper()}
{label_name}: {report.name}
{label_email}: {report.email}
{label_node}: {report.selectedNode}
{label_time}: {timestamp}

{label_desc}:
{report.description}

{id_label}: {report_id}
        """
        
        msg = MIMEMultipart(os.getenv("EMAIL_MIME_TYPE"))
        msg[os.getenv("EMAIL_SUBJECT_HEADER")] = subject
        msg[os.getenv("EMAIL_FROM_HEADER")] = EMAIL_CONFIG[os.getenv("EMAIL_KEY")]
        msg[os.getenv("EMAIL_TO_HEADER")] = EMAIL_CONFIG[os.getenv("RECIPIENT_KEY")]
        
        text_part = MIMEText(text_content, os.getenv("TEXT_MIME_TYPE"), os.getenv("EMAIL_ENCODING"))
        html_part = MIMEText(html_content, os.getenv("HTML_MIME_TYPE"), os.getenv("EMAIL_ENCODING"))
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        smtp_server_key = os.getenv("SMTP_SERVER_KEY")
        smtp_port_key = os.getenv("SMTP_PORT_KEY")
        email_key = os.getenv("EMAIL_KEY")
        password_key = os.getenv("PASSWORD_KEY")
        
        with smtplib.SMTP(EMAIL_CONFIG[smtp_server_key], EMAIL_CONFIG[smtp_port_key]) as server:
            server.starttls()
            server.login(EMAIL_CONFIG[email_key], EMAIL_CONFIG[password_key])
            server.send_message(msg)
        
        success_field = os.getenv("SUCCESS_FIELD_NAME")
        message_field = os.getenv("MESSAGE_FIELD_NAME")
        report_id_field = os.getenv("REPORT_ID_FIELD_NAME")
        success_message = os.getenv("SUCCESS_RESPONSE_TEXT")
        
        return {
            success_field: True, 
            message_field: success_message,
            report_id_field: report_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {str(e)}")
        error_field = os.getenv("ERROR_FIELD_NAME")
        error_prefix = os.getenv("SEND_ERROR_PREFIX")
        raise HTTPException(status_code=500, detail={error_field: f'{error_prefix}: {str(e)}'})

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    error_field = os.getenv("ERROR_FIELD_NAME")
    message_field = os.getenv("MESSAGE_FIELD_NAME")
    details_field = os.getenv("DETAILS_FIELD_NAME")
    validation_error = os.getenv("VALIDATION_ERROR_TEXT")
    return {error_field: {message_field: validation_error, details_field: str(exc)}}
